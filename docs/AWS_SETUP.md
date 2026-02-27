# AWS Infrastructure Setup — CLI Commands

All commands used to set up the StackAdvisor AWS infrastructure.
Run these in order if you need to recreate the setup from scratch.

## Prerequisites

- AWS CLI installed (`brew install awscli`)
- GitHub CLI installed (`brew install gh`)
- IAM user with these policies attached:
  - `AmazonEC2ContainerRegistryFullAccess`
  - `AmazonECS_FullAccess`
  - `ElasticLoadBalancingFullAccess`
  - `IAMFullAccess`
  - `CloudWatchLogsFullAccess`

## 1. Configure AWS CLI

```bash
aws configure
# AWS Access Key ID: <your-access-key>
# AWS Secret Access Key: <your-secret-key>
# Default region: us-east-1
# Default output format: json

# Verify:
aws sts get-caller-identity
```

## 2. Set GitHub Secrets

```bash
echo "<your-access-key>" | gh secret set AWS_ACCESS_KEY_ID --repo codewithkanika/stack-sense-with-sdk
echo "<your-secret-key>" | gh secret set AWS_SECRET_ACCESS_KEY --repo codewithkanika/stack-sense-with-sdk

# Verify:
gh secret list --repo codewithkanika/stack-sense-with-sdk
```

## 3. Create ECR Repositories

```bash
aws ecr create-repository --repository-name stackadvisor-backend --region us-east-1
aws ecr create-repository --repository-name stackadvisor-frontend --region us-east-1
```

## 4. Create ECS Cluster

```bash
aws ecs create-cluster --cluster-name stackadvisor-cluster --region us-east-1
```

## 5. Get Default VPC and Subnets

```bash
# Get default VPC ID
aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --query "Vpcs[0].VpcId" --output text --region us-east-1

# Get subnets (pick 2 in different AZs)
aws ec2 describe-subnets --filters "Name=vpc-id,Values=<VPC_ID>" --query "Subnets[*].[SubnetId,AvailabilityZone]" --output text --region us-east-1
```

## 6. Create Security Groups

```bash
# ALB security group (public-facing)
aws ec2 create-security-group \
  --group-name stackadvisor-alb-sg \
  --description "ALB security group for StackAdvisor" \
  --vpc-id <VPC_ID> \
  --region us-east-1
# Note the ALB_SG_ID from output

# ECS tasks security group
aws ec2 create-security-group \
  --group-name stackadvisor-ecs-sg \
  --description "ECS tasks security group for StackAdvisor" \
  --vpc-id <VPC_ID> \
  --region us-east-1
# Note the ECS_SG_ID from output

# Allow HTTP inbound on ALB
aws ec2 authorize-security-group-ingress \
  --group-id <ALB_SG_ID> \
  --protocol tcp --port 80 --cidr 0.0.0.0/0 \
  --region us-east-1

# Allow backend port from ALB to ECS
aws ec2 authorize-security-group-ingress \
  --group-id <ECS_SG_ID> \
  --protocol tcp --port 8000 --source-group <ALB_SG_ID> \
  --region us-east-1

# Allow frontend port from ALB to ECS
aws ec2 authorize-security-group-ingress \
  --group-id <ECS_SG_ID> \
  --protocol tcp --port 3000 --source-group <ALB_SG_ID> \
  --region us-east-1
```

## 7. Create Application Load Balancer

```bash
aws elbv2 create-load-balancer \
  --name stackadvisor-alb \
  --subnets <SUBNET_1> <SUBNET_2> \
  --security-groups <ALB_SG_ID> \
  --scheme internet-facing \
  --type application \
  --region us-east-1
# Note the ALB_ARN and DNSName from output

# Set idle timeout to 300s for WebSocket support
aws elbv2 modify-load-balancer-attributes \
  --load-balancer-arn <ALB_ARN> \
  --attributes Key=idle_timeout.timeout_seconds,Value=300 \
  --region us-east-1
```

## 8. Create Target Groups

```bash
# Backend target group
aws elbv2 create-target-group \
  --name stackadvisor-backend-tg \
  --protocol HTTP --port 8000 \
  --vpc-id <VPC_ID> \
  --target-type ip \
  --health-check-path /health \
  --health-check-interval-seconds 30 \
  --healthy-threshold-count 2 \
  --region us-east-1
# Note the BACKEND_TG_ARN from output

# Frontend target group
aws elbv2 create-target-group \
  --name stackadvisor-frontend-tg \
  --protocol HTTP --port 3000 \
  --vpc-id <VPC_ID> \
  --target-type ip \
  --health-check-path / \
  --health-check-interval-seconds 30 \
  --healthy-threshold-count 2 \
  --region us-east-1
# Note the FRONTEND_TG_ARN from output
```

## 9. Create ALB Listener and Routing Rules

```bash
# Default listener → frontend
aws elbv2 create-listener \
  --load-balancer-arn <ALB_ARN> \
  --protocol HTTP --port 80 \
  --default-actions Type=forward,TargetGroupArn=<FRONTEND_TG_ARN> \
  --region us-east-1
# Note the LISTENER_ARN from output

# Route /api/* → backend
aws elbv2 create-rule \
  --listener-arn <LISTENER_ARN> \
  --priority 10 \
  --conditions Field=path-pattern,Values='/api/*' \
  --actions Type=forward,TargetGroupArn=<BACKEND_TG_ARN> \
  --region us-east-1

# Route /ws/* → backend
aws elbv2 create-rule \
  --listener-arn <LISTENER_ARN> \
  --priority 20 \
  --conditions Field=path-pattern,Values='/ws/*' \
  --actions Type=forward,TargetGroupArn=<BACKEND_TG_ARN> \
  --region us-east-1

# Route /health → backend
aws elbv2 create-rule \
  --listener-arn <LISTENER_ARN> \
  --priority 30 \
  --conditions Field=path-pattern,Values='/health' \
  --actions Type=forward,TargetGroupArn=<BACKEND_TG_ARN> \
  --region us-east-1
```

## 10. Create ECS Task Execution Role

```bash
aws iam create-role \
  --role-name ecsTaskExecutionRole \
  --assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"ecs-tasks.amazonaws.com"},"Action":"sts:AssumeRole"}]}'

aws iam attach-role-policy \
  --role-name ecsTaskExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

aws iam attach-role-policy \
  --role-name ecsTaskExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/CloudWatchLogsFullAccess
```

## 11. Register Task Definitions

```bash
# Backend (replace ANTHROPIC_API_KEY value with your real key)
aws ecs register-task-definition \
  --family stackadvisor-backend \
  --network-mode awsvpc \
  --requires-compatibilities FARGATE \
  --cpu 512 --memory 1024 \
  --execution-role-arn arn:aws:iam::<ACCOUNT_ID>:role/ecsTaskExecutionRole \
  --container-definitions '[{
    "name": "backend",
    "image": "<ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/stackadvisor-backend:latest",
    "portMappings": [{"containerPort": 8000, "protocol": "tcp"}],
    "essential": true,
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
        "awslogs-group": "/ecs/stackadvisor-backend",
        "awslogs-region": "us-east-1",
        "awslogs-stream-prefix": "ecs",
        "awslogs-create-group": "true"
      }
    },
    "environment": [{"name": "ANTHROPIC_API_KEY", "value": "<YOUR_ANTHROPIC_API_KEY>"}]
  }]' \
  --region us-east-1

# Frontend
aws ecs register-task-definition \
  --family stackadvisor-frontend \
  --network-mode awsvpc \
  --requires-compatibilities FARGATE \
  --cpu 256 --memory 512 \
  --execution-role-arn arn:aws:iam::<ACCOUNT_ID>:role/ecsTaskExecutionRole \
  --container-definitions '[{
    "name": "frontend",
    "image": "<ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/stackadvisor-frontend:latest",
    "portMappings": [{"containerPort": 3000, "protocol": "tcp"}],
    "essential": true,
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
        "awslogs-group": "/ecs/stackadvisor-frontend",
        "awslogs-region": "us-east-1",
        "awslogs-stream-prefix": "ecs",
        "awslogs-create-group": "true"
      }
    }
  }]' \
  --region us-east-1
```

## 12. Create ECS Services

```bash
# Backend service
aws ecs create-service \
  --cluster stackadvisor-cluster \
  --service-name stackadvisor-backend \
  --task-definition stackadvisor-backend \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[<SUBNET_1>,<SUBNET_2>],securityGroups=[<ECS_SG_ID>],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=<BACKEND_TG_ARN>,containerName=backend,containerPort=8000" \
  --region us-east-1

# Frontend service
aws ecs create-service \
  --cluster stackadvisor-cluster \
  --service-name stackadvisor-frontend \
  --task-definition stackadvisor-frontend \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[<SUBNET_1>,<SUBNET_2>],securityGroups=[<ECS_SG_ID>],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=<FRONTEND_TG_ARN>,containerName=frontend,containerPort=3000" \
  --region us-east-1
```

## 13. Deploy via GitHub Actions

```bash
gh workflow run deploy.yml --repo codewithkanika/stack-sense-with-sdk --ref main
```

## Common Operations

### Scale up (start the app)
```bash
aws ecs update-service --cluster stackadvisor-cluster --service stackadvisor-backend --desired-count 1 --region us-east-1
aws ecs update-service --cluster stackadvisor-cluster --service stackadvisor-frontend --desired-count 1 --region us-east-1
```

### Scale down (stop to save costs)
```bash
aws ecs update-service --cluster stackadvisor-cluster --service stackadvisor-backend --desired-count 0 --region us-east-1
aws ecs update-service --cluster stackadvisor-cluster --service stackadvisor-frontend --desired-count 0 --region us-east-1
```

### Check service status
```bash
aws ecs describe-services --cluster stackadvisor-cluster \
  --services stackadvisor-backend stackadvisor-frontend \
  --query "services[*].[serviceName,runningCount,desiredCount,deployments[0].rolloutState]" \
  --output table --region us-east-1
```

### Force redeploy (after pushing new images)
```bash
aws ecs update-service --cluster stackadvisor-cluster --service stackadvisor-backend --force-new-deployment --region us-east-1
aws ecs update-service --cluster stackadvisor-cluster --service stackadvisor-frontend --force-new-deployment --region us-east-1
```

### Update Anthropic API key
```bash
# Re-register task definition with new key, then update service
aws ecs register-task-definition --family stackadvisor-backend ... # (with new key in environment)
aws ecs update-service --cluster stackadvisor-cluster --service stackadvisor-backend --task-definition stackadvisor-backend:<NEW_REVISION> --force-new-deployment --region us-east-1
```

### Check ALB URL
```bash
aws elbv2 describe-load-balancers --names stackadvisor-alb --query "LoadBalancers[0].DNSName" --output text --region us-east-1
```

## Current Resource IDs (from this setup)

| Resource | ID |
|---|---|
| VPC | `vpc-01037ce83fecaa94d` |
| Subnet 1 (us-east-1a) | `subnet-08ba8cd2671e28d4b` |
| Subnet 2 (us-east-1b) | `subnet-0312485313fd847c7` |
| ALB SG | `sg-043f60c67cf1ae9da` |
| ECS SG | `sg-0cb5f72289fde7722` |
| ALB ARN | `arn:aws:elasticloadbalancing:us-east-1:135899518107:loadbalancer/app/stackadvisor-alb/f6aefff09ad76f6d` |
| ALB DNS | `stackadvisor-alb-1138865749.us-east-1.elb.amazonaws.com` |
| Backend TG ARN | `arn:aws:elasticloadbalancing:us-east-1:135899518107:targetgroup/stackadvisor-backend-tg/91d11724c90794da` |
| Frontend TG ARN | `arn:aws:elasticloadbalancing:us-east-1:135899518107:targetgroup/stackadvisor-frontend-tg/f5c4e2d2dab91b76` |
| Listener ARN | `arn:aws:elasticloadbalancing:us-east-1:135899518107:listener/app/stackadvisor-alb/f6aefff09ad76f6d/5c10ebe30e2be0ea` |
| AWS Account ID | `135899518107` |

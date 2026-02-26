import RequirementsForm from "@/components/input/RequirementsForm";

export default function Home() {
  return (
    <main className="min-h-[calc(100vh-65px)] bg-zinc-50 dark:bg-zinc-950 py-12 px-4">
      <div className="mx-auto max-w-3xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">
            Tell us about your project
          </h1>
          <p className="mt-2 text-zinc-500">
            We&apos;ll evaluate the best tech stack for your requirements
          </p>
        </div>
        <RequirementsForm />
      </div>
    </main>
  );
}

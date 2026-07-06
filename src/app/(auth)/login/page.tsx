import { LoginForm } from "@/components/forms/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 space-y-6 bg-card rounded-2xl border border-border shadow-2xl animate-in fade-in zoom-in duration-500">
        <div className="text-center">
          <h1 className="text-3xl font-heading font-bold text-primary">Kakinada Fresh</h1>
          <p className="text-sm text-muted-foreground mt-2">Enterprise Admin Access</p>
        </div>
        
        <LoginForm />
      </div>
    </div>
  );
}

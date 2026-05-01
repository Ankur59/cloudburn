import LoginForm from '../components/LoginForm';

const Login = () => {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#EDEDED] flex items-center justify-center px-4 py-12" style={{ fontFamily: 'Geist Sans, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <div className="w-full max-w-md">
        <div className="overflow-hidden rounded-lg border border-[#222222] bg-[#111111] p-8 shadow-[0_18px_60px_rgba(0,0,0,0.55)]">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-[#222222] bg-[#0A0A0A] text-xl font-semibold text-[#EDEDED]">
              C
            </div>
            <div className="text-xs uppercase tracking-[0.35em] text-[#A1A1A1]">
              Cloudburn
            </div>
            <h1 className="mt-4 text-3xl font-semibold text-[#EDEDED]">
              Sign in to your account
            </h1>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
};

export default Login;

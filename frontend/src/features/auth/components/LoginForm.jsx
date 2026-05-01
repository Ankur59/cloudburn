import { useState } from 'react';
import { useForm } from 'react-hook-form';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.64 9.20441C17.64 8.5666 17.5791 7.95702 17.4668 7.375L9 7.875V10.875H13.8842C13.703 11.9581 13.1462 12.8735 12.2468 13.5246L14.9468 15.8246C16.6927 14.3279 17.64 11.9952 17.64 9.20441Z" fill="#4285F4"/>
    <path d="M9 18C11.43 18 13.44 17.135 14.9468 15.8246L12.2468 13.5246C11.4584 14.1032 10.43 14.4558 9 14.4558C6.675 14.4558 4.71209 12.8813 4.14028 10.8014L1.32028 12.9714C2.83875 15.9341 5.73982 18 9 18Z" fill="#34A853"/>
    <path d="M4.14028 10.8014C3.95578 10.2195 3.85841 9.595 3.85841 8.95585C3.85841 8.31668 3.95578 7.6922 4.14028 7.11031L1.32028 4.94034C0.602617 6.21106 0.18 7.56617 0.18 8.95585C0.18 10.3455 0.602617 11.7006 1.32028 12.9714L4.14028 10.8014Z" fill="#FBBC05"/>
    <path d="M9 3.45586C10.4684 3.45586 11.764 4.0205 12.7108 4.94606L15.0168 2.64006C13.4277 1.1573 11.4292 0.272461 9 0.272461C5.73982 0.272461 2.83875 2.33856 1.32028 5.30133L4.14028 7.4713C4.71209 5.39142 6.675 3.81689 9 3.81689V3.45586Z" fill="#EA4335"/>
  </svg>
);

const LoginForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    mode: 'onTouched',
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data) => {
    setSubmitStatus('');
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsSubmitting(false);
    setSubmitStatus('Signed in successfully.');
    console.log('Login data:', data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <button
        type="button"
        className="group mt-0 inline-flex w-full items-center justify-center gap-3 rounded-md border border-white/10
    hover:bg-zinc-700/80 bg-zinc-800/80 px-4 py-3 text-sm   text-zinc-100
    font-medium transition hover:brightness-95 backdrop-blur-sm duration-400 cursor-pointer"
      >
        <GoogleIcon />
        Continue with Google
      </button>

      <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.35em] text-[#A1A1A1]">
        <span className="h-px flex-1 bg-[#222222]" />
        <span>or continue with email</span>
        <span className="h-px flex-1 bg-[#222222]" />
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium text-[#EDEDED]" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          className={`w-full rounded-md border px-4 py-3 text-sm font-mono text-[#EDEDED] outline-none transition focus:border-white focus:ring-2 focus:ring-white/10 ${
            errors.email ? 'border-[#C94E4E] bg-[#1A1A1A]' : 'border-[#222222] bg-[#111111]'
          }`}
          {...register('email', {
            required: 'Email is required.',
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: 'Enter a valid email address.',
            },
          })}
        />
        {errors.email && (
          <p className="text-sm text-[#C94E4E]">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium text-[#EDEDED]" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          className={`w-full rounded-md border px-4 py-3 text-sm font-mono text-[#EDEDED] outline-none transition focus:border-white focus:ring-2 focus:ring-white/10 ${
            errors.password ? 'border-[#C94E4E] bg-[#1A1A1A]' : 'border-[#222222] bg-[#111111]'
          }`}
          {...register('password', {
            required: 'Password is required.',
            minLength: {
              value: 6,
              message: 'Password must be at least 6 characters.',
            },
          })}
        />
        {errors.password && (
          <p className="text-sm text-[#C94E4E]">{errors.password.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex w-full items-center justify-center rounded-md  bg-zinc-100 px-4 py-3 text-sm font-semibold text-black transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
      >
        {isSubmitting ? (
          <span className="inline-flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
            Signing in...
          </span>
        ) : (
          'Sign in'
        )}
      </button>

      <div className="text-center">
        <a href="#" className="text-sm text-[#A1A1A1] transition hover:text-[#EDEDED]">
          Forgot password?
        </a>
      </div>

      <div className="border-t border-[#222222] pt-4 text-center text-sm text-[#A1A1A1]">
        Don&apos;t have an account?{' '}
        <a href="/signup" className="font-semibold text-[#EDEDED] transition hover:text-white">
          Create one
        </a>
      </div>

      {submitStatus && (
        <div className="rounded-xl border border-[#4DB87A]/40 bg-[#1B2E1E] px-4 py-3 text-sm text-[#D9F1D9]">
          {submitStatus}
        </div>
      )}
    </form>
  );
};

export default LoginForm;

import Image from 'next/image'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0D14] text-slate-200">
      
      {/* Background Effect */}
      <div className="fixed inset-0 pointer-events-none opacity-20" style={{
        backgroundImage: `radial-gradient(circle at 50% 0%, #10B981 0%, transparent 40%), radial-gradient(circle at 100% 100%, #F59E0B 0%, transparent 40%)`
      }} />

      <div className="z-10 w-full max-w-md p-8 bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl">
        <div className="mb-8 text-center flex flex-col items-center">
          <Image src="/logo.png" alt="Project Cues Logo" width={180} height={60} className="mb-4" />
          <h1 className="text-xl font-light text-slate-300 tracking-[0.3em] uppercase">Grants</h1>
        </div>

        {params?.error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg text-sm text-center">
            {params.error}
          </div>
        )}

        <form className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1" htmlFor="email">Email</label>
            <input 
              id="email" 
              name="email" 
              type="email" 
              required 
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              placeholder="you@projectcues.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1" htmlFor="password">Password</label>
            <input 
              id="password" 
              name="password" 
              type="password" 
              required 
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              placeholder="••••••••"
            />
          </div>

          <div className="mt-4 flex flex-col gap-3">
            <button 
              formAction="/api/auth/login" 
              formMethod="post"
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              Sign In
            </button>
            <button 
              formAction="/api/auth/signup" 
              formMethod="post"
              className="w-full bg-transparent border border-slate-700 hover:border-slate-500 text-slate-300 font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Create Account
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

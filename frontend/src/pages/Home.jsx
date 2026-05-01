import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ScanLine, ShieldCheck, Leaf, Camera, Sparkles, Apple, AlertTriangle, ArrowRight } from 'lucide-react';

function Feature({ icon: Icon, title, desc }) {
  return (
    <div className="card p-6 space-y-3" data-testid={`home-feature-${title.toLowerCase().replace(/\s+/g,'-')}`}>
      <span className="w-11 h-11 rounded-2xl bg-leaf-50 text-leaf-700 grid place-items-center">
        <Icon size={20}/>
      </span>
      <h4 className="font-semibold text-ink-900">{title}</h4>
      <p className="text-sm text-neutral-600 leading-snug">{desc}</p>
    </div>
  );
}

export default function Home() {
  const { isAuthed } = useAuth();

  return (
    <div className="space-y-16">
      {/* HERO */}
      <section className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 items-center animate-fade-up">
        <div className="space-y-6">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-leaf-50 text-leaf-700 text-sm font-semibold">
            <Sparkles size={14}/> AI-Powered Food Intelligence
          </span>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-ink-900 leading-[1.05]">
            Know what&apos;s really in your <span className="text-leaf-600">food.</span>
          </h1>
          <p className="text-lg text-neutral-600 max-w-xl">
            Snap a photo of any food label. NutriScan reads the ingredients with Azure Vision,
            analyzes them with Azure OpenAI, and gives you a health score, allergen alerts, and smarter alternatives — in seconds.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            {isAuthed ? (
              <>
                <Link to="/analyze" className="btn-primary" data-testid="home-cta-analyze">
                  <ScanLine size={16}/> Scan a label
                </Link>
                <Link to="/dashboard" className="btn-ghost" data-testid="home-cta-dashboard">
                  Your dashboard <ArrowRight size={14}/>
                </Link>
              </>
            ) : (
              <Link to="/login" className="btn-primary" data-testid="home-cta-login">
                Login to analyze your food <ArrowRight size={16}/>
              </Link>
            )}
          </div>
        </div>

        <div className="relative">
          <div className="aspect-[4/5] rounded-[2.5rem] bg-gradient-to-br from-leaf-100 via-leaf-50 to-white border border-leaf-100 p-8 shadow-xl shadow-leaf-600/10 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-leaf-700 font-semibold">
              <Leaf size={18}/> NutriScan
            </div>
            <div className="space-y-4">
              <div className="flex items-end gap-4">
                <div className="font-display text-7xl font-extrabold text-leaf-700 leading-none">84</div>
                <div className="pb-2">
                  <div className="text-sm uppercase tracking-widest text-neutral-500">Health Score</div>
                  <div className="font-semibold text-leaf-700">Healthy</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="pill bg-white border border-leaf-200 text-leaf-800">🌾 gluten-free</span>
                <span className="pill bg-white border border-leaf-200 text-leaf-800">low sodium</span>
                <span className="pill bg-amber-50 border border-amber-200 text-amber-800">⚠ contains soy</span>
              </div>
              <p className="text-sm text-neutral-600 bg-white/70 rounded-2xl p-3 border border-leaf-100">
                Whole-grain, minimally processed — a solid everyday choice.
              </p>
            </div>
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span>Scanned just now</span>
              <span className="flex items-center gap-1"><ShieldCheck size={12}/> Private</span>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
        <Feature icon={Camera}         title="Scan food"           desc="Upload any packaged-food label. OCR extracts every ingredient line."/>
        <Feature icon={AlertTriangle}  title="Detect ingredients"   desc="Flags preservatives, hidden sugars, trans fats & risky additives."/>
        <Feature icon={Apple}          title="Get health insights"  desc="0-100 score, allergen alerts, and healthier alternatives tailored to each product."/>
      </section>

      {/* CTA */}
      {!isAuthed && (
        <section className="card p-10 text-center bg-gradient-to-br from-leaf-50 to-white" data-testid="home-login-cta">
          <h3 className="font-display text-3xl sm:text-4xl font-extrabold mb-3">Ready to scan your pantry?</h3>
          <p className="text-neutral-600 mb-6 max-w-xl mx-auto">
            Create a free account. Your scans, history and dashboard are private to you.
          </p>
          <Link to="/login" className="btn-primary" data-testid="home-bottom-login">
            Login to analyze your food <ArrowRight size={16}/>
          </Link>
        </section>
      )}
    </div>
  );
}
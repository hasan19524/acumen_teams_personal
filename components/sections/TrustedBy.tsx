export default function TrustedBy() {
  return (
    <section className="relative z-10 py-16 px-6 lg:px-10 border-t border-[#F1F5F9] bg-white/50">
      <div className="max-w-[1400px] mx-auto text-center">
        <p className="text-sm text-[#94A3B8] font-medium mb-8 tracking-wide uppercase">
          Trusted by 10,000+ teams worldwide
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-16 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
          {["Google", "Microsoft", "Amazon", "Netflix", "Spotify", "Airbnb"].map((company) => (
            <span key={company} className="text-xl font-bold text-[#475569] tracking-tight">
              {company}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
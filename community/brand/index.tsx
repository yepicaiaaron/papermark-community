import { BRAND } from "./config";

export { BRAND };

export function BrandMark({ className = "h-8" }: { className?: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={BRAND.logo}
        alt={`${BRAND.name} logo`}
        className={`${className} w-auto`}
      />
      {BRAND.custom ? (
        <span className="text-xl font-semibold tracking-tight text-gray-900">
          {BRAND.name}
        </span>
      ) : null}
    </span>
  );
}

export function BrandPanel() {
  return (
    <div className="relative hidden w-full items-center justify-center overflow-hidden bg-gray-950 md:flex md:w-[45%] lg:w-[45%]">
      <div className="flex max-w-sm flex-col items-center gap-6 px-8 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={BRAND.logo} alt="" className="h-20 w-auto" />
        <div className="text-3xl font-semibold tracking-tight text-white">
          {BRAND.name}
        </div>
        <p className="text-balance text-sm text-gray-400">{BRAND.tagline}</p>
      </div>
    </div>
  );
}

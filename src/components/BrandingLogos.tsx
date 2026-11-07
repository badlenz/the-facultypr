import React from 'react';

// Official Image URLs provided by studio management
export const LOGO_URLS = {
  BADLENZ_PNG: '/assets/branding/badlenz-logo.png',
  BADLENZ_FALLBACK: 'https://i.postimg.cc/0zk0MGmV/BADLENZ.png',
  THE_FACULTY_JPG: '/assets/branding/the-faculty-crest-hd.jpg',
  THE_FACULTY_PNG: '/assets/branding/the-faculty-crest-hd.jpg',
  THE_FACULTY_FALLBACK: 'https://i.postimg.cc/3k8F4jpZ/The-Faculty.jpg',
  GOLD_SEAL_JPG: '/assets/branding/badlenz-gold-seal.jpg',
};

// LA FACULTAD STUDIO - Official Shield / Crest Logo
export const LFCrestLogo: React.FC<{ className?: string; size?: 'sm' | 'md' | 'lg' | 'xl' }> = ({ 
  className = '', 
  size = 'md' 
}) => {
  const dimensions = size === 'sm' 
    ? 'w-9 h-9' 
    : size === 'lg' 
    ? 'w-16 h-16' 
    : size === 'xl' 
    ? 'w-24 h-24' 
    : 'w-12 h-12';

  return (
    <div className={`relative flex items-center justify-center select-none ${dimensions} ${className}`}>
      <img
        src={LOGO_URLS.THE_FACULTY_PNG}
        alt="The Faculty Studio Logo"
        className="w-full h-full object-contain filter drop-shadow-xl hover:scale-105 transition-transform duration-300 rounded-sm"
        onError={(e) => {
          (e.target as HTMLImageElement).src = LOGO_URLS.THE_FACULTY_FALLBACK;
        }}
      />
    </div>
  );
};

// BADLENZ Logo - Official Badlenz Graphic Badge
export const BadlenzLogo: React.FC<{ className?: string; size?: 'sm' | 'md' | 'lg' | 'xl' }> = ({ 
  className = '', 
  size = 'md' 
}) => {
  const heightClass = size === 'sm' ? 'h-6' : size === 'lg' ? 'h-14' : size === 'xl' ? 'h-20' : 'h-9';
  
  return (
    <div className={`inline-flex items-center justify-center select-none ${className}`}>
      <img
        src={LOGO_URLS.BADLENZ_PNG}
        alt="BADLENZ Logo"
        className={`${heightClass} object-contain filter drop-shadow-[0_4px_14px_rgba(220,38,38,0.45)] hover:scale-105 transition-all duration-300`}
        onError={(e) => {
          (e.target as HTMLImageElement).src = LOGO_URLS.BADLENZ_FALLBACK;
        }}
      />
    </div>
  );
};

// BADLENZ Gold 3D Seal - Official Master Audio Quality & Studio Crown Emblem
export const BadlenzGoldSeal: React.FC<{ className?: string; size?: 'sm' | 'md' | 'lg' | 'xl' }> = ({
  className = '',
  size = 'md'
}) => {
  const dimensions = size === 'sm'
    ? 'w-12 h-12'
    : size === 'lg'
    ? 'w-28 h-28'
    : size === 'xl'
    ? 'w-44 h-44'
    : 'w-20 h-20';

  return (
    <div className={`relative flex items-center justify-center select-none group ${dimensions} ${className}`}>
      <div className="absolute inset-0 bg-amber-500/20 rounded-2xl blur-xl group-hover:bg-amber-400/30 transition-all duration-500 pointer-events-none" />
      <img
        src={LOGO_URLS.GOLD_SEAL_JPG}
        alt="Badlenz Productions Gold Seal of Excellence"
        className="relative z-10 w-full h-full object-cover rounded-2xl border border-amber-500/40 shadow-[0_10px_25px_rgba(245,158,11,0.25)] group-hover:scale-105 group-hover:shadow-[0_15px_35px_rgba(245,158,11,0.4)] transition-all duration-300"
      />
    </div>
  );
};

// Official PDF Header with Yellow/Gold Banner & Logos (LF Shield on Left, Badlenz on Right)
export const StudioDocumentHeader: React.FC<{
  documentTitle: string;
  documentSubtitle?: string;
  metadataLeft?: React.ReactNode;
  metadataRight?: React.ReactNode;
}> = ({ documentTitle, documentSubtitle = 'LA FACULTAD STUDIO | BADLENZ', metadataLeft, metadataRight }) => {
  return (
    <div className="w-full bg-[#111113] text-white border-t-4 border-b-2 border-red-600 rounded-t-xl overflow-hidden font-sans shadow-2xl">
      {/* Logos & Branding Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950">
        <LFCrestLogo size="md" />
        <div className="text-center">
          <span className="text-xs font-black tracking-widest text-red-500 uppercase block">
            SISTEMA OFICIAL DE ESTUDIO
          </span>
          <span className="text-sm sm:text-base font-extrabold text-amber-400 tracking-wider">
            LA FACULTAD STUDIO | BADLENZ
          </span>
        </div>
        <BadlenzLogo size="md" />
      </div>

      {/* Gold / Yellow Title Banner */}
      <div className="bg-amber-400 text-slate-950 font-black py-3 px-4 text-center shadow-inner uppercase tracking-wider text-base sm:text-xl md:text-2xl border-y border-amber-500">
        {documentTitle}
      </div>

      {/* Subtitle */}
      <div className="bg-neutral-900 py-2 px-4 text-center border-b border-neutral-800">
        <h2 className="text-sm sm:text-base font-black tracking-wider text-amber-400 uppercase">
          {documentSubtitle}
        </h2>
      </div>

      {/* Metadata Row if provided */}
      {(metadataLeft || metadataRight) && (
        <div className="p-4 bg-neutral-950 border-b border-neutral-800 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>{metadataLeft}</div>
          <div className="text-left md:text-right">{metadataRight}</div>
        </div>
      )}
    </div>
  );
};

// Official PDF Footer
export const StudioDocumentFooter: React.FC = () => {
  return (
    <div className="w-full bg-[#111113] text-white border-t-2 border-b-4 border-red-600 rounded-b-xl px-6 py-4 mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-sans text-xs">
      <LFCrestLogo size="sm" />

      <div className="text-center space-y-1">
        <p className="font-extrabold tracking-wider text-slate-200 uppercase text-[11px]">
          LA FACULTAD STUDIO | BADLENZ &nbsp;•&nbsp; ✉ ellentemalo@gmail.com &nbsp;•&nbsp; 📷 @Badlenz (Instagram)
        </p>
        <p className="text-amber-400 italic text-[11px] font-semibold">
          “Transformando tu visión en sonido profesional.”
        </p>
      </div>

      <BadlenzLogo size="sm" />
    </div>
  );
};

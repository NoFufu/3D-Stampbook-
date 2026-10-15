const base = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const
};

export const IconBack = () => (
  <svg {...base}>
    <path d="M15 5l-7 7 7 7" />
  </svg>
);

export const IconForward = () => (
  <svg {...base}>
    <path d="M9 5l7 7-7 7" />
  </svg>
);

export const IconPlus = () => (
  <svg {...base}>
    <rect x="4" y="3" width="16" height="18" rx="2" />
    <path d="M12 8v8M8 12h8" />
  </svg>
);

export const IconTrash = () => (
  <svg {...base}>
    <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
  </svg>
);

export const IconBook = () => (
  <svg {...base}>
    <path d="M4 4h11a3 3 0 013 3v13H7a3 3 0 01-3-3z" />
    <path d="M4 17a3 3 0 013-3h11" />
  </svg>
);

export const IconView = () => (
  <svg {...base}>
    <path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z" />
    <circle cx="12" cy="12" r="2.5" />
  </svg>
);

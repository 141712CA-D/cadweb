"use client";

import { useEffect, useMemo, useRef, useState } from "react";

interface University {
  name: string;
  country: string;
}

// Module-level cache — the dataset is ~650KB, so every SignupForm/ContactForm
// instance on the page shares one fetch instead of re-requesting it.
let cachedUniversities: University[] | null = null;
let inFlightFetch: Promise<University[]> | null = null;

function loadUniversities(): Promise<University[]> {
  if (cachedUniversities) return Promise.resolve(cachedUniversities);
  if (!inFlightFetch) {
    inFlightFetch = fetch("/data/universities.json")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: University[]) => {
        cachedUniversities = data;
        return data;
      })
      .catch(() => {
        cachedUniversities = [];
        return [];
      });
  }
  return inFlightFetch;
}

const MAX_RESULTS = 8;

interface CollegeAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className: string;
  maxLength?: number;
}

export default function CollegeAutocomplete({ value, onChange, placeholder, className, maxLength }: CollegeAutocompleteProps) {
  const [universities, setUniversities] = useState<University[] | null>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Only fetch once the field is actually mounted (it's gated behind role
  // selection), not on initial page load — keeps the dataset off the
  // critical path for mobile visitors who never touch this field.
  useEffect(() => {
    loadUniversities().then(setUniversities);
  }, []);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // Freeform field — the list only ever suggests, it never restricts what
  // the user can type (some schools won't be in the dataset).
  const matches = useMemo(() => {
    const query = value.trim().toLowerCase();
    if (!query || !universities) return [];
    const starts: University[] = [];
    const contains: University[] = [];
    for (const u of universities) {
      const name = u.name.toLowerCase();
      if (name.startsWith(query)) starts.push(u);
      else if (contains.length < MAX_RESULTS && name.includes(query)) contains.push(u);
      if (starts.length >= MAX_RESULTS) break;
    }
    return [...starts, ...contains].slice(0, MAX_RESULTS);
  }, [value, universities]);

  const selectMatch = (name: string) => {
    onChange(name);
    setOpen(false);
    setActiveIndex(-1);
  };

  return (
    <div ref={containerRef} className="relative">
      <input
        className={className}
        placeholder={placeholder}
        value={value}
        maxLength={maxLength}
        autoComplete="off"
        role="combobox"
        aria-expanded={open && matches.length > 0}
        aria-autocomplete="list"
        onChange={(e) => { onChange(e.target.value); setOpen(true); setActiveIndex(-1); }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (!open || matches.length === 0) return;
          if (e.key === "ArrowDown") { e.preventDefault(); setActiveIndex((i) => (i + 1) % matches.length); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIndex((i) => (i - 1 + matches.length) % matches.length); }
          else if (e.key === "Enter" && activeIndex >= 0) { e.preventDefault(); selectMatch(matches[activeIndex].name); }
          else if (e.key === "Escape") { setOpen(false); }
        }}
      />
      {open && matches.length > 0 && (
        <ul className="absolute left-0 right-0 z-20 mt-1 max-h-60 overflow-y-auto border border-[#262626] bg-[#161616] shadow-xl">
          {matches.map((u, i) => (
            <li key={`${u.name}-${u.country}`}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectMatch(u.name)}
                className={`flex w-full flex-col items-start gap-0.5 px-4 py-3 text-left transition-colors ${
                  i === activeIndex ? "bg-[#1c1c1c]" : "active:bg-[#1c1c1c]"
                }`}
              >
                <span className="text-sm text-[#e8e8e8]">{u.name}</span>
                <span className="font-mono text-xs text-[#555]">{u.country}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

import { en } from './en'
import { hi } from './hi'
import { mr } from './mr'
import { ta } from './ta'
import { te } from './te'
import { kn } from './kn'
import { ml } from './ml'
import { gu } from './gu'
import { raj } from './raj'
import { ne } from './ne'
import { asLang } from './as'

export type Language =
  | 'English'
  | 'Hindi'
  | 'Marathi'
  | 'Tamil'
  | 'Telugu'
  | 'Kannada'
  | 'Malayalam'
  | 'Gujarati'
  | 'Rajasthani'
  | 'Nepali'
  | 'Assamese'

export const translations: Record<Language, Record<string, string>> = {
  English: en,
  Hindi: hi,
  Marathi: mr,
  Tamil: ta,
  Telugu: te,
  Kannada: kn,
  Malayalam: ml,
  Gujarati: gu,
  Rajasthani: raj,
  Nepali: ne,
  Assamese: asLang,
}

export const AVAILABLE_LANGUAGES: { value: Language; label: string; code: string; script: string }[] = [
  { value: 'English', label: 'English', code: 'en', script: 'Latin' },
  { value: 'Hindi', label: 'हिन्दी (Hindi)', code: 'hi', script: 'Devanagari' },
  { value: 'Marathi', label: 'मराठी (Marathi)', code: 'mr', script: 'Devanagari' },
  { value: 'Tamil', label: 'தமிழ் (Tamil)', code: 'ta', script: 'Tamil' },
  { value: 'Telugu', label: 'తెలుగు (Telugu)', code: 'te', script: 'Telugu' },
  { value: 'Kannada', label: 'ಕನ್ನಡ (Kannada)', code: 'kn', script: 'Kannada' },
  { value: 'Malayalam', label: 'മലയാളം (Malayalam)', code: 'ml', script: 'Malayalam' },
  { value: 'Gujarati', label: 'ગુજરાતી (Gujarati)', code: 'gu', script: 'Gujarati' },
  { value: 'Rajasthani', label: 'राजस्थानी (Rajasthani)', code: 'raj', script: 'Devanagari' },
  { value: 'Nepali', label: 'नेपाली (Nepali)', code: 'ne', script: 'Devanagari' },
  { value: 'Assamese', label: 'অসমীয়া (Assamese)', code: 'as', script: 'Bengali' },
]

/** Une clases condicionales (sustituto mínimo de clsx). */
export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

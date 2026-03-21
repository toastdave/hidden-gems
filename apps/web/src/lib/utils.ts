import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

type ChildProp = { child?: unknown }
type ChildrenProp = { children?: unknown }

export type WithoutChild<T> = T extends ChildProp ? Omit<T, 'child'> : T
export type WithoutChildren<T> = T extends ChildrenProp ? Omit<T, 'children'> : T
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null }

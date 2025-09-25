'use client'
import { Sidebar } from '@/components/Layouts/sidebar'; // Utilisez le sidebar principal
import { Header } from '@/components/Layouts/header';
import { LayoutWrapper } from "@/components/LayoutWrapper";

export default function GaragisteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Plus de sidebar/header ici - c'est LayoutWrapper qui s'en charge
  return children;
}
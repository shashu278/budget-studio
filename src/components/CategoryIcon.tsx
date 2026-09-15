import React from 'react';
import {
  Home,
  ShoppingCart,
  Utensils,
  Car,
  Zap,
  Film,
  HeartPulse,
  ShoppingBag,
  GraduationCap,
  HelpCircle,
  Briefcase,
  Laptop,
  TrendingUp,
  DollarSign,
  Gift,
  ShieldCheck,
  Plane,
  Coffee,
  Smartphone,
  PiggyBank,
  Award,
  Tag,
  CreditCard,
  Building,
  Music,
  Activity,
  Heart,
  BookOpen,
  Wifi,
  LucideProps,
} from 'lucide-react';

export const AVAILABLE_ICONS: Record<string, React.ComponentType<LucideProps>> = {
  Home,
  ShoppingCart,
  Utensils,
  Car,
  Zap,
  Film,
  HeartPulse,
  ShoppingBag,
  GraduationCap,
  HelpCircle,
  Briefcase,
  Laptop,
  TrendingUp,
  DollarSign,
  Gift,
  ShieldCheck,
  Plane,
  Coffee,
  Smartphone,
  PiggyBank,
  Award,
  Tag,
  CreditCard,
  Building,
  Music,
  Activity,
  Heart,
  BookOpen,
  Wifi,
};

interface CategoryIconProps {
  iconName?: string;
  className?: string;
  size?: number;
}

export function CategoryIcon({ iconName = 'Tag', className = 'w-5 h-5', size = 20 }: CategoryIconProps) {
  const IconComponent = AVAILABLE_ICONS[iconName] || AVAILABLE_ICONS['Tag'] || Tag;
  return <IconComponent className={className} size={size} />;
}

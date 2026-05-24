import {
    Home, Info, Phone, DollarSign, Layers, Zap, Shield, Users, Code, Palette, BarChart, Headphones, LayoutDashboard,
    type LucideIcon
} from 'lucide-react'

export interface NavSubLink {
    label: string;
    href: string;
    description?: string;
    icon?: LucideIcon;
    image?: string;

}

export interface MarketingNavItem {
    label: string;
    href: string;
    icon?: LucideIcon;
    content?: MarketingNavItemsContent;
    variant?: 'default' | 'primary' | 'action';
}

export interface MarketingNavItemsContent {
    title?: string;
    description?: string;
    icon?: string;
    href?: string;
    image?: string;
    subLinks?: NavSubLink[];
}

export const getMarketingNavConfig = (isAuthenticated: boolean): MarketingNavItem[] => [
    {
        label: 'Home',
        href: '/home',
        icon: Home,
        content: {
            title: 'Welcome Home',
            description: 'Discover our platform and features.',
            image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=280&h=160&fit=crop',
            href: '/',
            subLinks: [
                {
                    label: 'Overview',
                    href: '/#overview',
                    description: 'Platform overview',
                    icon: Home,
                },
                {
                    label: 'Features',
                    href: '/#features',
                    description: 'Explore our features',
                    icon: Zap,
                },
                {
                    label: 'Contact Us',
                    href: '/contact',
                    description: 'Get in touch',
                    icon: Phone,
                },
            ],
        },
    },
    {
        label: 'Products',
        href: '/products',
        icon: Layers,
        content: {
            title: 'Our Products',
            description: 'Powerful tools to build and manage your content.',
            image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=280&h=160&fit=crop',
            href: '/products',
            subLinks: [
                {
                    label: 'CMS Platform',
                    href: '/products/cms',
                    description: 'Headless content management',
                    icon: Layers,
                    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=80&h=80&fit=crop',
                },
                {
                    label: 'API Gateway',
                    href: '/products/api',
                    description: 'Fast and secure APIs',
                    icon: Zap,
                    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=80&h=80&fit=crop',
                },
                {
                    label: 'Security Suite',
                    href: '/products/security',
                    description: 'Enterprise-grade protection',
                    icon: Shield,
                    image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=80&h=80&fit=crop',
                },
            ],
        },
    },
    {
        label: 'Solutions',
        href: '/solutions',
        icon: Code,
        content: {
            title: 'Solutions',
            description: 'Tailored solutions for every team.',
            image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=280&h=160&fit=crop',
            href: '/solutions',
            subLinks: [
                {
                    label: 'For Developers',
                    href: '/solutions/developers',
                    description: 'Build faster with our SDK',
                    icon: Code,
                    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=80&h=80&fit=crop',
                },
                {
                    label: 'For Designers',
                    href: '/solutions/designers',
                    description: 'Design systems integration',
                    icon: Palette,
                    image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=80&h=80&fit=crop',
                },
                {
                    label: 'For Marketing',
                    href: '/solutions/marketing',
                    description: 'Analytics and insights',
                    icon: BarChart,
                    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=80&h=80&fit=crop',
                },
            ],
        },
    },
    {
        label: 'Pricing',
        href: '/pricing',
        icon: DollarSign,
        content: {
            title: 'Simple Pricing',
            description: 'Transparent plans for teams of all sizes.',
            image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=280&h=160&fit=crop',
            href: '/pricing',
            subLinks: [
                {
                    label: 'Starter',
                    href: '/pricing#starter',
                    description: 'Free for small projects',
                    icon: Users,
                },
                {
                    label: 'Pro',
                    href: '/pricing#pro',
                    description: '$29/mo per seat',
                    icon: Zap,
                },
                {
                    label: 'Enterprise',
                    href: '/pricing#enterprise',
                    description: 'Custom pricing',
                    icon: Shield,
                },
            ],
        },
    },
    {
        label: 'Company',
        href: '/about',
        icon: Info,
        content: {
            title: 'About Us',
            description: 'Learn about our mission and team.',
            image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=280&h=160&fit=crop',
            href: '/about',
            subLinks: [
                {
                    label: 'About',
                    href: '/about',
                    description: 'Our story and values',
                    icon: Info,
                },
                {
                    label: 'Careers',
                    href: '/careers',
                    description: 'Join our team',
                    icon: Users,
                },
                {
                    label: 'Contact',
                    href: '/contact',
                    description: 'Get in touch',
                    icon: Headphones,
                },
            ],
        },
    },

    isAuthenticated
        ? {
            label: 'Dashboard',
            href: '/dashboard',
            variant: 'action' as const,
            icon: LayoutDashboard,
            content: {
                title: 'Dashboard',
                description: 'Access your dashboard and manage your content.',
                image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=280&h=160&fit=crop',
                href: '/dashboard',
                subLinks: [
                    {
                        label: 'Dashboard',
                        href: '/dashboard',
                        description: 'Go to your dashboard',
                        icon: LayoutDashboard,
                    },
                ],
            },
        }
        : {
            label: 'Get Started',
            href: '/register',
            variant: 'action' as const,
            icon: Users,
            content: {
                title: 'Get Started',
                description: 'Start using our platform today.',
                image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=280&h=160&fit=crop',
                href: '/register',
                subLinks: [
                    {
                        label: 'Register',
                        href: '/register',
                        description: 'Sign up for an account',
                        icon: Users,
                    },
                    {
                        label: 'Login',
                        href: '/login',
                        description: 'Log in to your account',
                        icon: Users,
                    },
                ],
            },
        },
];
import {
    X,
    Menu,
    ArrowLeft,
    ArrowRight,
    ChevronDown,
    ChevronUp,
    ChevronLeft,
    ChevronRight,
    Check,
    Plus,
    Minus,
    Search,
    MoreVertical,
    Settings,
    User,
    LogOut,
    Users,
    Bell,
    Home,
    Folder,
    File,
    Image,
    PieChart,
    Bot,
    Rocket,
    Server,
    Link,
    Building,
    Clipboard,
    Pencil,
    Trash,
    Eye,
    Loader2,
    AlertTriangle,
    Info,
    CheckCircle,
    XCircle,
    PanelLeftClose,
    PanelLeftOpen,
    ChevronsUpDown,
    Send,
    Loader,
    FoldHorizontal,
    FoldVertical,
    Github,
    Twitter,
    Facebook,
    Linkedin,
    Instagram,
    Youtube,
    Slack,
    Figma,
    Dribbble,
    Chrome,
    Apple,
    Gitlab,
    Twitch,
    GitBranch,
    Key,
    List,
    ListChecks,
    CalendarDays,
    Clock as TimelineIcon,
    Shield,
    Save,
    Upload,
    Video,
    AudioLines,
    Grid3X3,
    FolderPlus,
    HardDrive,
    Ban,
    RotateCcw,
    ExternalLink,
    Play,
    Lock,
    Building2,
    Cloud,
    Columns,
    Target,
    FileBox,
    FileText,
    Activity,
    PlayCircle,
    Clock1,
    AlertCircle,
    MessageSquare,
    Zap,
    Mail,
    Phone,
    MapPin,
    Download,
    SendIcon,
    SendHorizontalIcon,
    SendHorizonalIcon,
    LucideSend,
    BookOpen,
} from 'lucide-react';

import {
    faGithub,
    faTwitter,
    faFacebook,
    faLinkedin,
    faInstagram,
    faGoogle,
    faYoutube,
    faSlack,
    faFigma,
    faDribbble,
    faGitlab
} from '@fortawesome/free-brands-svg-icons';

import type { ComponentType, SVGProps, SVGElementType, ForwardRefExoticComponent, RefAttributes } from 'react';
import type { LucideProps } from 'lucide-react';
import type { IconDefinition } from '@fortawesome/free-brands-svg-icons';

export type IconComponent = ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>> | IconDefinition;
export const iconRegistry = {
    'book-open': BookOpen,
    // Navigation / Actions
    'close': X,
    'menu': Menu,
    'panel-left-close': PanelLeftClose,
    'panel-left-open': PanelLeftOpen,
    'chevron-down': ChevronDown,
    'chevron-up': ChevronUp,
    'chevron-up-down': ChevronsUpDown,
    'chevron-left': ChevronLeft,
    'chevron-right': ChevronRight,
    'check': Check,
    'plus': Plus,
    'minus': Minus,
    'search': Search,
    'more-vertical': MoreVertical,
    'arrow-left': ArrowLeft,
    'arrow-right': ArrowRight,
    // User / Auth
    'settings': Settings,
    'user': User,
    'sign-out': LogOut,
    'users': Users,

    // Notifications
    'bell': Bell,
    // Dashboard / Navigation
    'home': Home,
    'dashboard': Home,
    'folder': Folder,
    'file': File,
    'file-text': File,
    'image': Image,

    // Analytics / AI
    'chart': PieChart,
    'robot': Bot,

    // Operations
    'rocket': Rocket,
    'server': Server,
    'link': Link,

    // Business
    'building': Building,
    'clipboard': Clipboard,

    // CRUD Actions
    'edit': Pencil,
    'trash': Trash,
    'eye': Eye,
    'eye-off': Eye,

    // States
    'spinner': Loader2,
    'warning': AlertTriangle,
    'info': Info,
    'success': CheckCircle,
    'error': XCircle,
    'git-branch': GitBranch,
    // Custom
    'send': LucideSend,
    'loader': Loader,
    'fold-horizontal': FoldHorizontal,
    'fold-vertical': FoldVertical,

    'key': Key,
    // Brands
    'github': faGithub,
    'twitter': faTwitter,
    'facebook': faFacebook,
    'linkedin': faLinkedin,
    'instagram': faInstagram,
    'google': faGoogle,
    'youtube': faYoutube,
    'slack': faSlack,
    'figma': faFigma,
    'dribbble': faDribbble,
    'chrome': Chrome,
    'apple': Apple,
    'gitlab': faGitlab,

    'list': List,
    'list-checks': ListChecks,
    'calendar-days': CalendarDays,
    'timeline': TimelineIcon,
    'save': Save,

    // Media
    'upload': Upload,
    'download': Download,
    'video': Video,
    'audio': AudioLines,
    'grid': Grid3X3,
    'grid-3x3': Grid3X3,
    'folder-plus': FolderPlus,
    'hard-drive': HardDrive,

    'ban': Ban,
    'rotate-ccw': RotateCcw,
    'external-link': ExternalLink,
    'play': Play,
    'lock': Lock,
    'building-2': Building2,
    'file-box': FileBox,
    'columns': Columns,
    'target': Target,
    'cloud': Cloud,
    'activity': Activity,
    'shield': Shield,
    'play-circle': PlayCircle,
    'clock': Clock1,
    'alert-circle': AlertCircle,
    'info-circle': Info,
    'message-square': MessageSquare,
    'zap': Zap,
    'mail': Mail,
    'phone': Phone,
    'map-pin': MapPin,
} as const;



export type IconName = keyof typeof iconRegistry;

/**
 * Get an icon component by name.
 * Returns undefined if the icon is not found.
 */
export function getIcon(name: IconName): IconComponent | undefined {
    return iconRegistry[name] as IconComponent;
}

/**
 * Check if an icon name exists in the registry.
 */
export function hasIcon(name: string): name is IconName {
    return name in iconRegistry;
}

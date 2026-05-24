import {
    NavigationMenu,
    NavigationMenuList,
    NavigationMenuItem,
    NavigationMenuTrigger,
    NavigationMenuContent,
    NavigationMenuLink,
    NavigationMenuViewport,
    NavigationMenuIndicator,
    BlurFade,
    Button,
    BlurFadeGsap,
} from '../shared/ui';
import { getMarketingNavConfig, MarketingNavItem, NavSubLink } from '../../config/marketing-nav.config';
import { useAppSelector } from '../../store/hooks';
import { selectIsAuthenticated } from '../../store/slices/authSlice';

const getDirection = (index: number, total: number): "left" | "right" | "down" => {
    const midpoint = (total - 1) / 2;
    if (index < midpoint) return "left";
    if (index > midpoint) return "right";
    return "left";
};


const SubLinkItem = ({ subLink }: { subLink: NavSubLink }) => {
    const Icon = subLink.icon;
    return (
        <NavigationMenuLink
            href={subLink.href}
            className="navigation-menu__sublink"
        >
            {subLink.image ? (
                <img
                    src={subLink.image}
                    alt={subLink.label}
                    className="navigation-menu__sublink-image"
                />
            ) : Icon ? (
                <div className="navigation-menu__sublink-icon">
                    <Icon size={20} />
                </div>
            ) : null}
            <div className="navigation-menu__sublink-text">
                <span className="navigation-menu__sublink-label">{subLink.label}</span>
                {subLink.description && (
                    <span className="navigation-menu__sublink-description">{subLink.description}</span>
                )}
            </div>
        </NavigationMenuLink>
    );
};

export const Navigation = () => {
    const isAuthenticated = useAppSelector(selectIsAuthenticated);
    const marketingNavConfig = getMarketingNavConfig(isAuthenticated);
    const totalItems = marketingNavConfig.length;

    return (
        <NavigationMenu>
            <NavigationMenuList>
                <div>
                    <span className="navigation-menu__logo">
                        S
                    </span>
                </div>
                {marketingNavConfig.map((item: MarketingNavItem, index: number) => (
                    <NavigationMenuItem key={item.label}>
                        <NavigationMenuTrigger>
                            <NavigationMenuLink href={item.href} className={`flex items-center space-x-2 ${item.variant === 'action' && 'navigation-menu__link--action'}`}>
                                <span>{item.label}</span>
                            </NavigationMenuLink>
                        </NavigationMenuTrigger>
                        <NavigationMenuContent
                            asChild
                            className={`navigation-menu__content ${item.variant === 'action' && 'navigation-menu__content--action'}`}>
                            <BlurFadeGsap
                                delay={0}
                                duration={0.4}
                                direction={getDirection(index, totalItems)}
                                blur="6px"
                            >
                                {item.content && (
                                    <div className={`navigation-menu__content-inner ${item.variant === 'action' && 'navigation-menu__content-inner--action'}`}>
                                        <div className="navigation-menu__featured">
                                            {item.content.image && (
                                                <div className="navigation-menu__featured-image-container">
                                                    <img
                                                        src={item.content.image}
                                                        alt={item.content.title}
                                                        className="navigation-menu__featured-image"
                                                    />
                                                    <div className="navigation-menu__featured-text">
                                                        <h3 className="navigation-menu__featured-title">{item.content.title}</h3>
                                                        <p className="navigation-menu__featured-description">{item.content.description}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {item.content.subLinks && item.content.subLinks.length && (
                                            <div className="navigation-menu__sublinks">
                                                {item.content.subLinks.map((subLink) => (
                                                    <SubLinkItem key={subLink.href} subLink={subLink} />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </BlurFadeGsap>
                        </NavigationMenuContent>
                    </NavigationMenuItem>
                ))}
            </NavigationMenuList>
            <NavigationMenuViewport />
        </NavigationMenu>
    );
}
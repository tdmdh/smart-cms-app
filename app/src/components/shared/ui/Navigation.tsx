
import * as React from 'react';
import * as NavigationMenuPrimitive from '@radix-ui/react-navigation-menu';



export const navigationMenuClasses = {
    root: 'navigation-menu__root',
    list: 'navigation-menu__list',
    item: 'navigation-menu__item',
    trigger: 'navigation-menu__trigger',
    content: 'navigation-menu__content',
    link: 'navigation-menu__link',
    viewport: 'navigation-menu__viewport',
    indicator: 'navigation-menu__indicator',
};


export const NavigationMenu = React.forwardRef<
    React.ComponentRef<typeof NavigationMenuPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Root>
>(({ className = "", ...props }, ref) => {
    const classes = [
        navigationMenuClasses.root,
        className
    ].filter(Boolean).join(' ');

    return (
        <NavigationMenuPrimitive.Root ref={ref} className={classes} {...props} />
    );
});
NavigationMenu.displayName = "NavigationMenu";


export const NavigationMenuList = React.forwardRef<
    React.ComponentRef<typeof NavigationMenuPrimitive.List>,
    React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.List>
>(({ className = "", ...props }, ref) => {
    const classes = [
        navigationMenuClasses.list,
        className
    ].filter(Boolean).join(' ');

    return (
        <NavigationMenuPrimitive.List ref={ref} className={classes} {...props} />
    );
});
NavigationMenuList.displayName = "NavigationMenuList";

export const NavigationMenuItem = React.forwardRef<
    React.ComponentRef<typeof NavigationMenuPrimitive.Item>,
    React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Item>
>(({ className = "", ...props }, ref) => {
    const classes = [
        navigationMenuClasses.item,
        className
    ].filter(Boolean).join(' ');

    return (
        <NavigationMenuPrimitive.Item ref={ref} className={classes} {...props} />
    );
});
NavigationMenuItem.displayName = "NavigationMenuItem";

export const NavigationMenuTrigger = React.forwardRef<
    React.ComponentRef<typeof NavigationMenuPrimitive.Trigger>,
    React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Trigger>
>(({ className = "", ...props }, ref) => {
    const classes = [
        navigationMenuClasses.trigger,
        className
    ].filter(Boolean).join(' ');

    return (
        <NavigationMenuPrimitive.Trigger ref={ref} className={classes} {...props} />
    );
});
NavigationMenuTrigger.displayName = "NavigationMenuTrigger";

export const NavigationMenuContent = React.forwardRef<
    React.ComponentRef<typeof NavigationMenuPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Content>
>(({ className = "", ...props }, ref) => {
    const classes = [
        navigationMenuClasses.content,
        className
    ].filter(Boolean).join(' ');

    return (
        <NavigationMenuPrimitive.Content ref={ref} className={classes} {...props} />
    );
});

NavigationMenuContent.displayName = "NavigationMenuContent";

export const NavigationMenuLink = React.forwardRef<
    React.ComponentRef<typeof NavigationMenuPrimitive.Link>,
    React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Link>
>(({ className = "", ...props }, ref) => {
    const classes = [
        navigationMenuClasses.link,
        className
    ].filter(Boolean).join(' ');

    return (
        <NavigationMenuPrimitive.Link ref={ref} className={classes} {...props} />
    );
});
NavigationMenuLink.displayName = "NavigationMenuLink";

export const NavigationMenuViewport = React.forwardRef<
    React.ComponentRef<typeof NavigationMenuPrimitive.Viewport>,
    React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Viewport>
>(({ className = "", ...props }, ref) => {
    const classes = [
        navigationMenuClasses.viewport,
        className
    ].filter(Boolean).join(' ');

    return (
        <NavigationMenuPrimitive.Viewport ref={ref} className={classes} {...props} />
    );
});
NavigationMenuViewport.displayName = "NavigationMenuViewport";

export const NavigationMenuIndicator = React.forwardRef<
    React.ComponentRef<typeof NavigationMenuPrimitive.Indicator>,
    React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Indicator>
>(({ className = "", ...props }, ref) => {
    const classes = [
        navigationMenuClasses.indicator,
        className
    ].filter(Boolean).join(' ');

    return (
        <NavigationMenuPrimitive.Indicator ref={ref} className={classes} {...props} />
    );
});
NavigationMenuIndicator.displayName = "NavigationMenuIndicator";
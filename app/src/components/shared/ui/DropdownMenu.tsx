'use client';
import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Check, ChevronRight, Circle } from "lucide-react";
import { Icon, IconName } from "./Icon";

export type DropdownMenuSize = 'sm' | 'md' | 'lg';

export interface DropdownMenuContentProps
    extends React.ComponentProps<typeof DropdownMenuPrimitive.Content> {
    size?: DropdownMenuSize;
}

export interface DropdownMenuItemProps
    extends React.ComponentProps<typeof DropdownMenuPrimitive.Item> {
    inset?: boolean;
    variant?: 'default' | 'danger' | 'success';
    shortcut?: string;
    icon?: IconName;
    iconSize?: number;
}

export interface DropdownMenuCheckboxItemProps
    extends React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem> {
    shortcut?: string;
}

export interface DropdownMenuRadioItemProps
    extends React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem> {
    shortcut?: string;
}

export interface DropdownMenuSubTriggerProps
    extends React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> {
    icon?: IconName;
    inset?: boolean;
}

const sizeClasses: Record<DropdownMenuSize, string> = {
    sm: 'dropdown-menu__content--sm',
    md: '',
    lg: 'dropdown-menu__content--lg',
};

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
export const DropdownMenuGroup = DropdownMenuPrimitive.Group;
export const DropdownMenuPortal = DropdownMenuPrimitive.Portal;
export const DropdownMenuSub = DropdownMenuPrimitive.Sub;
export const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

export const DropdownMenuContent = React.forwardRef<
    React.ComponentRef<typeof DropdownMenuPrimitive.Content>,
    DropdownMenuContentProps
>(({ className = "", size = 'md', sideOffset = 4, children, ...props }, ref) => {
    const classes = [
        'dropdown-menu__content',
        sizeClasses[size],
        className
    ].filter(Boolean).join(' ');

    return (
        <DropdownMenuPrimitive.Portal>
            <DropdownMenuPrimitive.Content
                ref={ref}
                sideOffset={sideOffset}
                className={classes}
                {...props}
            >
                {children}
            </DropdownMenuPrimitive.Content>
        </DropdownMenuPrimitive.Portal>
    );
});
DropdownMenuContent.displayName = "DropdownMenuContent";

export const DropdownMenuItem = React.forwardRef<
    React.ComponentRef<typeof DropdownMenuPrimitive.Item>,
    DropdownMenuItemProps
>(({ className = "", inset, variant = 'default', shortcut, icon, iconSize=14, children, ...props }, ref) => {
    const classes = [
        'dropdown-menu__item',
        inset && 'dropdown-menu__item--inset',
        variant === 'danger' && 'dropdown-menu__item--danger',
        variant === 'success' && 'dropdown-menu__item--success',
        className
    ].filter(Boolean).join(' ');

    return (
        <DropdownMenuPrimitive.Item ref={ref} className={classes} {...props}>
            {icon && <Icon name={icon} size={iconSize} className="dropdown-menu__item-icon" />}
            <span className="dropdown-menu__item-content">{children}</span>
            {shortcut && <DropdownMenuShortcut>{shortcut}</DropdownMenuShortcut>}
        </DropdownMenuPrimitive.Item>
    );
});
DropdownMenuItem.displayName = "DropdownMenuItem";

export const DropdownMenuCheckboxItem = React.forwardRef<
    React.ComponentRef<typeof DropdownMenuPrimitive.CheckboxItem>,
    DropdownMenuCheckboxItemProps
>(({ className = "", children, checked, shortcut, ...props }, ref) => {
    const classes = [
        'dropdown-menu__checkbox',
        className
    ].filter(Boolean).join(' ');

    return (
        <DropdownMenuPrimitive.CheckboxItem
            ref={ref}
            className={classes}
            checked={checked}
            {...props}
        >
            <span className="dropdown-menu__checkbox__indicator">
                <DropdownMenuPrimitive.ItemIndicator>
                    <Check />
                </DropdownMenuPrimitive.ItemIndicator>
            </span>
            <span className="dropdown-menu__item-content">{children}</span>
            {shortcut && <DropdownMenuShortcut>{shortcut}</DropdownMenuShortcut>}
        </DropdownMenuPrimitive.CheckboxItem>
    );
});
DropdownMenuCheckboxItem.displayName = "DropdownMenuCheckboxItem";

export const DropdownMenuRadioItem = React.forwardRef<
    React.ComponentRef<typeof DropdownMenuPrimitive.RadioItem>,
    DropdownMenuRadioItemProps
>(({ className = "", children, shortcut, ...props }, ref) => {
    const classes = [
        'dropdown-menu__radio',
        className
    ].filter(Boolean).join(' ');

    return (
        <DropdownMenuPrimitive.RadioItem ref={ref} className={classes} {...props}>
            <span className="dropdown-menu__radio__indicator">
                <DropdownMenuPrimitive.ItemIndicator />
            </span>
            <span className="dropdown-menu__item-content">{children}</span>
            {shortcut && <DropdownMenuShortcut>{shortcut}</DropdownMenuShortcut>}
        </DropdownMenuPrimitive.RadioItem>
    );
});
DropdownMenuRadioItem.displayName = "DropdownMenuRadioItem";

export const DropdownMenuLabel = React.forwardRef<
    React.ComponentRef<typeof DropdownMenuPrimitive.Label>,
    React.ComponentProps<typeof DropdownMenuPrimitive.Label> & { inset?: boolean }
>(({ className = "", inset, ...props }, ref) => {
    const classes = [
        'dropdown-menu__label',
        inset && 'dropdown-menu__label--inset',
        className
    ].filter(Boolean).join(' ');

    return (
        <DropdownMenuPrimitive.Label ref={ref} className={classes} {...props} />
    );
});
DropdownMenuLabel.displayName = "DropdownMenuLabel";

export const DropdownMenuSeparator = React.forwardRef<
    React.ComponentRef<typeof DropdownMenuPrimitive.Separator>,
    React.ComponentProps<typeof DropdownMenuPrimitive.Separator>
>(({ className = "", ...props }, ref) => {
    const classes = [
        'dropdown-menu__separator',
        className
    ].filter(Boolean).join(' ');

    return (
        <DropdownMenuPrimitive.Separator ref={ref} className={classes} {...props} />
    );
});
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";

export const DropdownMenuShortcut: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({
    className = "",
    ...props
}) => {
    const classes = [
        'dropdown-menu__shortcut',
        className
    ].filter(Boolean).join(' ');

    return <span className={classes} {...props} />;
};
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";

export const DropdownMenuSubTrigger = React.forwardRef<
    React.ComponentRef<typeof DropdownMenuPrimitive.SubTrigger>,
    DropdownMenuSubTriggerProps
>(({ className = "", icon, inset, children, ...props }, ref) => {
    const classes = [
        'dropdown-menu__sub__trigger',
        inset && 'dropdown-menu__item--inset',
        className
    ].filter(Boolean).join(' ');

    return (
        <DropdownMenuPrimitive.SubTrigger ref={ref} className={classes} {...props}>
            {icon && <span className="dropdown-menu__item-icon">{icon}</span>}
            <span className="dropdown-menu__item-content">{children}</span>
            {/* <ChevronRight className="dropdown-menu__chevron" /> */}
        </DropdownMenuPrimitive.SubTrigger>
    );
});
DropdownMenuSubTrigger.displayName = "DropdownMenuSubTrigger";

export const DropdownMenuSubContent = React.forwardRef<
    React.ComponentRef<typeof DropdownMenuPrimitive.SubContent>,
    React.ComponentProps<typeof DropdownMenuPrimitive.SubContent>
>(({ className = "", ...props }, ref) => {
    const classes = [
        'dropdown-menu__sub__content',
        className
    ].filter(Boolean).join(' ');

    return (
        <DropdownMenuPrimitive.Portal>
            <DropdownMenuPrimitive.SubContent ref={ref} className={classes} {...props} />
        </DropdownMenuPrimitive.Portal>
    );
});
DropdownMenuSubContent.displayName = "DropdownMenuSubContent";

export const DropdownMenuArrow = React.forwardRef<
    React.ComponentRef<typeof DropdownMenuPrimitive.Arrow>,
    React.ComponentProps<typeof DropdownMenuPrimitive.Arrow>
>(({ className = "", ...props }, ref) => {
    const classes = [
        'dropdown-menu__arrow',
        className
    ].filter(Boolean).join(' ');

    return (
        <DropdownMenuPrimitive.Arrow ref={ref} className={classes} {...props} />
    );
});
DropdownMenuArrow.displayName = "DropdownMenuArrow";

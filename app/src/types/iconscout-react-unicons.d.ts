// Type declarations for @iconscout/react-unicons
// This package doesn't ship with TypeScript definitions

declare module '@iconscout/react-unicons' {
    import { ComponentType, SVGProps } from 'react';

    interface UniconProps extends SVGProps<SVGSVGElement> {
        /** Icon size in pixels or string (e.g., '24', '2em') */
        size?: number | string;
        /** Icon color */
        color?: string;
    }

    type UniconComponent = ComponentType<UniconProps>;

    // Navigation / Actions
    export const UilTimes: UniconComponent;
    export const UilBars: UniconComponent;
    export const UilAngleLeftB: UniconComponent;
    export const UilAngleRightB: UniconComponent;
    export const UilAngleDown: UniconComponent;
    export const UilAngleUp: UniconComponent;
    export const UilCheck: UniconComponent;
    export const UilPlus: UniconComponent;
    export const UilMinus: UniconComponent;
    export const UilSearch: UniconComponent;
    export const UilEllipsisV: UniconComponent;

    // User / Auth
    export const UilSetting: UniconComponent;
    export const UilUser: UniconComponent;
    export const UilSignout: UniconComponent;
    export const UilUsersAlt: UniconComponent;

    // Notifications
    export const UilBell: UniconComponent;

    // Dashboard / Navigation
    export const UilHome: UniconComponent;
    export const UilApps: UniconComponent;
    export const UilFolder: UniconComponent;
    export const UilFile: UniconComponent;
    export const UilFileAlt: UniconComponent;
    export const UilImage: UniconComponent;

    // Analytics / AI
    export const UilChart: UniconComponent;
    export const UilRobot: UniconComponent;

    // Operations
    export const UilRocket: UniconComponent;
    export const UilServer: UniconComponent;
    export const UilLink: UniconComponent;

    // Business
    export const UilBuilding: UniconComponent;
    export const UilClipboardAlt: UniconComponent;

    // CRUD Actions
    export const UilEdit: UniconComponent;
    export const UilTrashAlt: UniconComponent;
    export const UilEye: UniconComponent;
    export const UilEyeSlash: UniconComponent;

    // States
    export const UilSpinner: UniconComponent;
    export const UilExclamationTriangle: UniconComponent;
    export const UilInfoCircle: UniconComponent;
    export const UilCheckCircle: UniconComponent;
    export const UilTimesCircle: UniconComponent;
}

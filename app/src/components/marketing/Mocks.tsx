import type { HTMLAttributes } from "react"

export type MocksMode = 'simple' | 'detailed';

export interface MocksProps extends HTMLAttributes<HTMLDivElement> {
  url?: string
  imageSrc?: string
  videoSrc?: string
  mode?: MocksMode
}

export function Mocks({
  imageSrc,
  videoSrc,
  url,
  mode = "simple",
  className,
  style,
  ...props
}: MocksProps) {
    const hasVideo = !!videoSrc
    const hasMedia = hasVideo || !!imageSrc



    return (
        <div
            className={`mocks mocks--${mode} ${className ?? ''}`}
            style={style}
            {...props}
        >
            <div className="mocks__browser">
                <div className="mocks__browser__header">
                    {/* <div className="mocks__browser__header__buttons">
                        <span className="mocks__browser__header__button mocks__browser__header__button--red" />
                        <span className="mocks__browser__header__button mocks__browser__header__button--yellow" />
                        <span className="mocks__browser__header__button mocks__browser__header__button--green" />
                    </div> */}
                    {url && <div className="mocks__browser__header__url">{url}</div>}
                </div>
                <div className="mocks__browser__content">
                    {hasMedia ? (
                        hasVideo ? (
                            <video
                                className="mocks__browser__content__video"
                                src={videoSrc}
                                autoPlay
                                loop
                                muted
                                playsInline
                            />
                        ) : (
                            <img
                                className="mocks__browser__content__image"
                                src={imageSrc}
                                alt="Mockup"
                            />
                        )
                    ) : (
                        <div className="mocks__browser__content__placeholder">
                            No media provided
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
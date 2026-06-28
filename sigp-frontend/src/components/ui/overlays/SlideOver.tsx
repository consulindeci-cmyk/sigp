import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';

const SlideOver = DialogPrimitive.Root;
const SlideOverTrigger = DialogPrimitive.Trigger;
const SlideOverClose = DialogPrimitive.Close;
const SlideOverPortal = DialogPrimitive.Portal;

const SlideOverOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    {...props}
  />
));
SlideOverOverlay.displayName = DialogPrimitive.Overlay.displayName;

const SlideOverContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <SlideOverPortal>
    <SlideOverOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-border bg-background shadow-2xl transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-md lg:max-w-lg xl:max-w-2xl',
        className
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </SlideOverPortal>
));
SlideOverContent.displayName = DialogPrimitive.Content.displayName;

const SlideOverHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex items-center justify-between border-b border-border px-6 py-4',
      className
    )}
    {...props}
  />
);
SlideOverHeader.displayName = 'SlideOverHeader';

const SlideOverTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-lg font-semibold text-foreground', className)}
    {...props}
  />
));
SlideOverTitle.displayName = DialogPrimitive.Title.displayName;

const SlideOverBody = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex-1 overflow-y-auto p-6', className)}
    {...props}
  />
));
SlideOverBody.displayName = 'SlideOverBody';

const SlideOverFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex items-center justify-end gap-3 border-t border-border px-6 py-4 bg-muted/20',
      className
    )}
    {...props}
  />
);
SlideOverFooter.displayName = 'SlideOverFooter';

export {
  SlideOver,
  SlideOverTrigger,
  SlideOverClose,
  SlideOverContent,
  SlideOverHeader,
  SlideOverTitle,
  SlideOverBody,
  SlideOverFooter,
};

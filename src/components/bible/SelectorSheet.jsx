import React from 'react';
import { Drawer } from 'vaul';
import { X } from 'lucide-react';

/**
 * Mobile-first bottom sheet wrapper for selectors.
 * On desktop (sm+) it renders nothing special — children are shown inline via the parent popover.
 * On mobile it wraps children in a Vaul drawer.
 */
export default function SelectorSheet({ open, onClose, title, children }) {
  return (
    <Drawer.Root open={open} onOpenChange={(o) => { if (!o) onClose(); }} shouldScaleBackground handleOnly>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Drawer.Content
          className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-2xl bg-card border-t border-border max-h-[80vh] sm:max-h-[85vh]"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={(e) => {
            // Opening a native <select> picker (and dismissing it) fires
            // pointer/focus events Vaul treats as "outside", which instantly
            // closes the sheet. The OS picker often reports the target as the
            // body/overlay rather than the <select>, so we can't reliably guard
            // by target. Since the sheet already has an explicit close button
            // and drag handle, block ALL interact-outside dismissal here.
            e.preventDefault();
          }}
          onPointerDownOutside={(e) => e.preventDefault()}
          onFocusOutside={(e) => e.preventDefault()}
        >
          {/* Drag handle — only this can be dragged to dismiss (handleOnly) */}
          <Drawer.Handle className="mx-auto mt-3 mb-2 !w-10 !h-1.5 rounded-full bg-border flex-shrink-0" />
          <div className="flex items-center justify-center relative pb-3 flex-shrink-0 px-4">
            {title && (
              <p className="font-sans text-sm font-semibold text-foreground text-center">{title}</p>
            )}
            <button 
              onClick={onClose} 
              className="absolute right-4 p-1 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div data-vaul-no-drag className="overflow-y-auto flex-1 px-4 pb-6">
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
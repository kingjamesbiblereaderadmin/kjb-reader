import React from 'react';
import { Drawer } from 'vaul';

/**
 * Mobile-first bottom sheet wrapper for selectors.
 * On desktop (sm+) it renders nothing special — children are shown inline via the parent popover.
 * On mobile it wraps children in a Vaul drawer.
 */
export default function SelectorSheet({ open, onClose, title, children }) {
  return (
    <Drawer.Root open={open} onOpenChange={(o) => { if (!o) onClose(); }} shouldScaleBackground>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-2xl bg-card border-t border-border max-h-[80vh] sm:max-h-[85vh]">
          {/* Drag handle */}
          <div className="mx-auto mt-3 mb-2 w-10 h-1.5 rounded-full bg-border flex-shrink-0" />
          {title && (
            <p className="font-sans text-sm font-semibold text-foreground text-center pb-3 flex-shrink-0 px-4">{title}</p>
          )}
          <div className="overflow-y-auto flex-1 px-4 pb-6">
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
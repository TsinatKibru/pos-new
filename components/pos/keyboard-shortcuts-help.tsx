import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Keyboard } from "lucide-react";

export function KeyboardShortcutsHelp() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9" title="Keyboard Shortcuts">
                    <Keyboard className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Keyboard Shortcuts</DialogTitle>
                    <DialogDescription>
                        Use these keys to speed up your workflow.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 items-center gap-4">
                        <div className="font-medium">Search Products</div>
                        <div className="flex justify-end">
                            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                                F2
                            </kbd>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 items-center gap-4">
                        <div className="font-medium">Checkout / Pay</div>
                        <div className="flex justify-end">
                            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                                Enter
                            </kbd>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 items-center gap-4">
                        <div className="font-medium">Close Dialogs</div>
                        <div className="flex justify-end">
                            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                                Esc
                            </kbd>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

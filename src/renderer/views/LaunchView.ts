import {LaunchItem} from "./LaunchListView";

export interface LaunchView {
    input: HTMLInputElement;
    bind(items: LaunchItem[]): void;
    clearItems(): void;
    clearInput(): void;
    focusNext(): void;
    focusPrevious(): void;
    focusInput(): void;
}
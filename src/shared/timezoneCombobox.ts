import { searchTimezoneOptions, TIMEZONE_OPTIONS } from "./timezones";
import type { TimezoneOption } from "./types";

export interface TimezoneCombobox {
  setSelected(timezoneId: string): void;
}

export function mountTimezoneCombobox(
  input: HTMLInputElement,
  listbox: HTMLElement,
  initialTimezone: string,
  onSelect: (timezoneId: string) => void,
): TimezoneCombobox {
  let selectedId = initialTimezone;
  let visibleOptions: TimezoneOption[] = [];
  let activeIndex = -1;

  input.setAttribute("role", "combobox");
  input.setAttribute("aria-autocomplete", "list");
  input.setAttribute("aria-expanded", "false");
  input.setAttribute("aria-controls", listbox.id);
  listbox.setAttribute("role", "listbox");
  listbox.hidden = true;

  const labelFor = (timezoneId: string): string =>
    TIMEZONE_OPTIONS.find((option) => option.id === timezoneId)?.label ?? timezoneId;

  const close = (): void => {
    listbox.hidden = true;
    input.setAttribute("aria-expanded", "false");
    input.removeAttribute("aria-activedescendant");
    activeIndex = -1;
    input.value = labelFor(selectedId);
  };

  const setActive = (index: number): void => {
    if (!visibleOptions.length) return;
    activeIndex = (index + visibleOptions.length) % visibleOptions.length;
    const active = listbox.querySelector<HTMLElement>(`#timezone-option-${activeIndex}`);
    input.setAttribute("aria-activedescendant", active?.id ?? "");
    listbox.querySelectorAll("[role='option']").forEach((option, optionIndex) => {
      option.setAttribute("aria-selected", String(optionIndex === activeIndex));
      option.classList.toggle("is-active", optionIndex === activeIndex);
    });
    active?.scrollIntoView({ block: "nearest" });
  };

  const select = (option: TimezoneOption): void => {
    selectedId = option.id;
    input.value = option.label;
    close();
    onSelect(option.id);
  };

  const render = (query: string): void => {
    visibleOptions = searchTimezoneOptions(query).slice(0, 80);
    activeIndex = -1;
    listbox.replaceChildren();

    for (const [index, option] of visibleOptions.entries()) {
      const row = document.createElement("li");
      row.id = `timezone-option-${index}`;
      row.setAttribute("role", "option");
      row.setAttribute("aria-selected", String(option.id === selectedId));
      row.textContent = option.label;
      row.addEventListener("mousedown", (event) => event.preventDefault());
      row.addEventListener("click", () => select(option));
      listbox.append(row);
    }

    if (!visibleOptions.length) {
      const empty = document.createElement("li");
      empty.className = "combobox-empty";
      empty.textContent = "No timezones found.";
      listbox.append(empty);
    }
    listbox.hidden = false;
    input.setAttribute("aria-expanded", "true");
  };

  input.value = labelFor(selectedId);
  input.addEventListener("focus", () => {
    input.select();
    render("");
  });
  input.addEventListener("input", () => render(input.value));
  input.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (listbox.hidden) render(input.value);
      setActive(activeIndex + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (listbox.hidden) render(input.value);
      setActive(activeIndex < 0 ? visibleOptions.length - 1 : activeIndex - 1);
    } else if (event.key === "Enter" && !listbox.hidden) {
      event.preventDefault();
      const option = visibleOptions[activeIndex];
      if (option) select(option);
    } else if (event.key === "Escape" && !listbox.hidden) {
      event.preventDefault();
      input.value = labelFor(selectedId);
      close();
    }
  });

  document.addEventListener("pointerdown", (event) => {
    const target = event.target;
    if (target instanceof Node && !input.contains(target) && !listbox.contains(target)) close();
  });

  return {
    setSelected(timezoneId: string): void {
      selectedId = timezoneId;
      if (document.activeElement !== input || listbox.hidden) input.value = labelFor(timezoneId);
    },
  };
}

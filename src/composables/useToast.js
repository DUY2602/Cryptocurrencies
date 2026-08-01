import { ref } from "vue";

const toasts = ref([]);
let nextId = 1;

function push(type, message) {
  const id = nextId++;
  toasts.value.push({ id, type, message });
  setTimeout(() => remove(id), 3500);
}

function remove(id) {
  toasts.value = toasts.value.filter((t) => t.id !== id);
}

export function useToast() {
  return {
    toasts,
    success: (msg) => push("success", msg),
    error: (msg) => push("error", msg),
    info: (msg) => push("info", msg),
    remove,
  };
}

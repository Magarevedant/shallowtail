(() => {
  const storageKey = "shallowtail:payments";

  function isPaymentRecord(record) {
    return record !== null
      && typeof record === "object"
      && typeof record.id === "string"
      && typeof record.amount === "string"
      && Number.isFinite(Number(record.amount))
      && Number(record.amount) > 0
      && typeof record.note === "string"
      && typeof record.createdAt === "string"
      && !Number.isNaN(Date.parse(record.createdAt))
      && (record.status === "paid" || record.status === "unpaid")
      && typeof record.url === "string"
      && isPaymentUrl(record.url);
  }

  function isPaymentUrl(value) {
    try {
      const url = new URL(value, window.location.origin);
      return url.origin === window.location.origin && url.pathname === "/api/payment";
    } catch {
      return false;
    }
  }

  function read() {
    let stored;
    try {
      stored = window.localStorage.getItem(storageKey);
    } catch {
      throw new Error("Browser storage is unavailable.");
    }

    if (stored === null) {
      return [];
    }

    let records;
    try {
      records = JSON.parse(stored);
    } catch {
      throw new Error("Your saved payment tracker data could not be read.");
    }

    if (!Array.isArray(records) || !records.every(isPaymentRecord)) {
      throw new Error("Your saved payment tracker data is invalid.");
    }
    return records;
  }

  function write(records) {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(records));
    } catch {
      throw new Error("Browser storage is full or unavailable.");
    }
  }

  function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  }

  function add(payment) {
    const record = {
      id: createId(),
      amount: payment.amount,
      note: payment.note,
      url: payment.url,
      createdAt: payment.createdAt,
      status: "unpaid",
    };

    if (!isPaymentRecord(record)) {
      throw new Error("The payment details could not be saved to the tracker.");
    }

    const records = read();
    records.unshift(record);
    write(records);
    return record;
  }

  function list() {
    return read().sort((first, second) => Date.parse(second.createdAt) - Date.parse(first.createdAt));
  }

  function setStatus(id, status) {
    if (status !== "paid" && status !== "unpaid") {
      throw new Error("Choose a valid payment status.");
    }

    const records = read();
    const record = records.find((item) => item.id === id);
    if (!record) {
      throw new Error("That payment could not be found in your tracker.");
    }

    record.status = status;
    write(records);
    return record;
  }

  window.ShallowtailPayments = { add, list, setStatus };
})();

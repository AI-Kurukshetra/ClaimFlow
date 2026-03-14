export function formatClaimDate(value: string | null, emptyLabel = "Not provided") {
  if (!value) {
    return emptyLabel;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function formatClaimCurrency(value: number | null, emptyLabel = "Awaiting estimate") {
  if (value === null) {
    return emptyLabel;
  }

  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    style: "currency",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatClaimDescription(value: string | null) {
  if (!value) {
    return "No incident description has been added yet.";
  }

  const normalized = value.replace(/\r\n/g, "\n");
  const lines = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return "No incident description has been added yet.";
  }

  const timestampedEntries: { line: string; timestamp: number }[] = [];
  const regularEntries: string[] = [];

  lines.forEach((line) => {
    const match = line.match(/^\[([^\]]+)\]\s/);

    if (!match) {
      regularEntries.push(line);
      return;
    }

    const parsed = Date.parse(match[1]);

    if (Number.isNaN(parsed)) {
      regularEntries.push(line);
      return;
    }

    timestampedEntries.push({ line, timestamp: parsed });
  });

  timestampedEntries.sort((a, b) => b.timestamp - a.timestamp);

  return [...timestampedEntries.map((entry) => entry.line), ...regularEntries].join("\n");
}

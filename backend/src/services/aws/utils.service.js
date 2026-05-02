
export const fmt = (date) => date.toISOString().split("T")[0];

export const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

export const monthsAgo = (n) => {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  d.setDate(1);
  return d;
};

export const today = () => new Date();

// AWS tag format is "tagKey$tagValue" — extract the value portion
export const parseTagValue = (raw) => {
  if (raw && raw.includes("$")) {
    const val = raw.split("$")[1];
    if (val && val.trim()) return val.trim();
  }
  return "unassigned";
};

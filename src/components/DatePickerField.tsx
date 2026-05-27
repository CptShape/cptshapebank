import React, { useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { parseDateOnly } from "../services/subscriptions";

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function DatePickerField({ label, onChange, value }: Props) {
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const selected = parseDateOnly(value);
    return new Date(selected.getFullYear(), selected.getMonth(), 1);
  });

  const days = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const firstWeekday = (firstDay.getDay() + 6) % 7;
    const numberOfDays = new Date(year, month + 1, 0).getDate();
    const cells: Array<{ day: number; iso: string } | null> = [];

    for (let index = 0; index < firstWeekday; index += 1) {
      cells.push(null);
    }

    for (let day = 1; day <= numberOfDays; day += 1) {
      const iso = new Date(year, month, day, 12, 0, 0, 0).toISOString().slice(0, 10);
      cells.push({ day, iso });
    }

    return cells;
  }, [visibleMonth]);

  const monthLabel = visibleMonth.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        onPress={() => {
          setVisibleMonth(new Date(parseDateOnly(value).getFullYear(), parseDateOnly(value).getMonth(), 1));
          setOpen(true);
        }}
        style={styles.trigger}
      >
        <Text style={styles.value}>{value}</Text>
      </Pressable>

      <Modal animationType="fade" transparent visible={open}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.header}>
              <Pressable onPress={() => setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}>
                <Text style={styles.arrow}>{"<"}</Text>
              </Pressable>
              <Text style={styles.monthLabel}>{monthLabel}</Text>
              <Pressable onPress={() => setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}>
                <Text style={styles.arrow}>{">"}</Text>
              </Pressable>
            </View>

            <View style={styles.weekdays}>
              {weekdayLabels.map((weekday) => (
                <Text key={weekday} style={styles.weekday}>
                  {weekday}
                </Text>
              ))}
            </View>

            <View style={styles.grid}>
              {days.map((item, index) =>
                item ? (
                  <Pressable
                    key={item.iso}
                    onPress={() => {
                      onChange(item.iso);
                      setOpen(false);
                    }}
                    style={[styles.dayCell, item.iso === value && styles.dayCellActive]}
                  >
                    <Text style={[styles.dayText, item.iso === value && styles.dayTextActive]}>{item.day}</Text>
                  </Pressable>
                ) : (
                  <View key={`empty-${index}`} style={styles.dayCell} />
                ),
              )}
            </View>

            <Pressable onPress={() => setOpen(false)} style={styles.close}>
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 8 },
  label: { color: "#dce6ff", fontSize: 14, fontWeight: "700" },
  trigger: {
    backgroundColor: "rgba(11, 18, 37, 0.85)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  value: { color: "#f8fbff", fontSize: 15 },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(1, 6, 18, 0.72)",
    justifyContent: "center",
    alignItems: "center",
    padding: 18,
  },
  sheet: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#0f1830",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    gap: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  arrow: { color: "#5eead4", fontSize: 22, fontWeight: "800", width: 28, textAlign: "center" },
  monthLabel: { color: "#f8fbff", fontSize: 18, fontWeight: "800" },
  weekdays: { flexDirection: "row" },
  weekday: { flex: 1, color: "#90a4cf", fontSize: 12, textAlign: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap", rowGap: 6 },
  dayCell: {
    width: "14.2857%",
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  dayCellActive: {
    backgroundColor: "#5eead4",
  },
  dayText: { color: "#dce6ff", fontWeight: "700" },
  dayTextActive: { color: "#082032" },
  close: {
    marginTop: 8,
    borderRadius: 14,
    backgroundColor: "#1d2b4d",
    paddingVertical: 12,
    alignItems: "center",
  },
  closeText: { color: "#dce6ff", fontWeight: "700" },
});

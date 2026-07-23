import type { WatchedAlertPreferences } from "@/lib/api/watched";
import { Checkbox } from "@/components/ui/checkbox";

type NotificationPreferenceKey =
  | "email_recommend"
  | "email_watched_property"
  | "email_watched_community"
  | "email_watched_area"
  | "push_watched_property";

interface NotificationPreferenceGroupProps {
  title: string;
  preferences: [NotificationPreferenceKey, string][];
  alertPreferences: WatchedAlertPreferences;
  onChange: (key: NotificationPreferenceKey, checked: boolean) => void;
}

export function NotificationPreferenceGroup({
  title,
  preferences,
  alertPreferences,
  onChange,
}: NotificationPreferenceGroupProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-[minmax(9rem,1fr)_minmax(14rem,1.25fr)] sm:items-start">
      <h3 className="pt-0.5 text-sm font-semibold text-ds-heading">{title}</h3>
      <div className="space-y-3">
        {preferences.map(([key, label]) => {
          const id = `notification-${key}`;
          return (
            <label key={key} htmlFor={id} className="flex cursor-pointer items-center gap-2.5 text-sm text-ds-body">
              <Checkbox
                id={id}
                checked={alertPreferences[key]}
                onCheckedChange={(checked) => onChange(key, checked === true)}
                className="border-ds-primary data-[state=checked]:bg-ds-primary"
              />
              {label}
            </label>
          );
        })}
      </div>
    </div>
  );
}

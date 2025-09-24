import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";

interface Alert {
  id: string;
  patient: string;
  message: string;
  time: string;
  severity: "low" | "medium" | "high" | "critical";
}

const mockAlerts: Alert[] = [
  {
    id: "1",
    patient: "John Smith",
    message: "Missed insulin dose - 2 hours overdue",
    time: "15 minutes ago",
    severity: "critical",
  },
  {
    id: "2",
    patient: "Maria Garcia",
    message: "Reports side effects from new medication",
    time: "1 hour ago",
    severity: "high",
  },
  {
    id: "3",
    patient: "Robert Chen",
    message: "Prescription refill needed in 3 days",
    time: "2 hours ago",
    severity: "medium",
  },
];

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case "critical":
      return "bg-red-50 border-red-200";
    case "high":
      return "bg-orange-50 border-orange-200";
    case "medium":
      return "bg-blue-50 border-blue-200";
    default:
      return "bg-gray-50 border-gray-200";
  }
};

const getSeverityDotColor = (severity: string) => {
  switch (severity) {
    case "critical":
      return "bg-red-500";
    case "high":
      return "bg-orange-500";
    case "medium":
      return "bg-blue-500";
    default:
      return "bg-gray-500";
  }
};

const getSeverityTextColor = (severity: string) => {
  switch (severity) {
    case "critical":
      return "text-red-600";
    case "high":
      return "text-orange-600";
    case "medium":
      return "text-blue-600";
    default:
      return "text-gray-600";
  }
};

export default function RecentAlerts() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Recent Alerts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`flex items-start space-x-3 p-3 rounded-lg border ${getSeverityColor(alert.severity)}`}
              data-testid={`alert-${alert.id}`}
            >
              <div className={`w-2 h-2 rounded-full mt-2 ${getSeverityDotColor(alert.severity)}`}></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{alert.patient}</p>
                <p className="text-xs text-muted-foreground">{alert.message}</p>
                <p className={`text-xs mt-1 ${getSeverityTextColor(alert.severity)}`}>
                  <Clock className="w-3 h-3 inline mr-1" />
                  {alert.time}
                </p>
              </div>
            </div>
          ))}
        </div>
        <Button
          variant="ghost"
          className="w-full mt-4 text-sm text-primary hover:text-primary/80"
          data-testid="button-view-all-alerts"
        >
          View all alerts
        </Button>
      </CardContent>
    </Card>
  );
}

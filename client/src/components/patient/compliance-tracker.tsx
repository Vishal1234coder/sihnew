import { useQuery } from "@tanstack/react-query";
import { useAuthHeaders } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Calendar, TrendingUp, Target, Award, BarChart3 } from "lucide-react";

interface ComplianceTrackerProps {
  patientId?: string;
}

export default function ComplianceTracker({ patientId }: ComplianceTrackerProps) {
  const authHeaders = useAuthHeaders();

  const { data: complianceStats = [], isLoading } = useQuery({
    queryKey: ["/api/compliance/stats", patientId],
    queryFn: async () => {
      if (!patientId) return [];
      const response = await fetch(`/api/compliance/stats/${patientId}?days=30`, {
        headers: authHeaders,
      });
      if (!response.ok) throw new Error("Failed to fetch compliance stats");
      return response.json();
    },
    enabled: !!patientId,
  });

  // Calculate overall compliance
  const calculateOverallCompliance = () => {
    if (complianceStats.length === 0) return 0;
    
    const totalDoses = complianceStats.reduce((sum: number, stat: any) => sum + stat.totalDoses, 0);
    const takenDoses = complianceStats.reduce((sum: number, stat: any) => sum + stat.takenDoses, 0);
    
    return totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 0;
  };

  // Get trend data for the last 7 days
  const getWeeklyTrend = () => {
    const last7Days = complianceStats.slice(0, 7);
    return last7Days.map((stat: any) => ({
      date: new Date(stat.date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
      rate: stat.complianceRate,
      taken: stat.takenDoses,
      total: stat.totalDoses,
    }));
  };

  const overallCompliance = calculateOverallCompliance();
  const weeklyTrend = getWeeklyTrend();
  const averageWeeklyCompliance = weeklyTrend.length > 0 
    ? Math.round(weeklyTrend.reduce((sum, day) => sum + day.rate, 0) / weeklyTrend.length)
    : 0;

  const getComplianceColor = (rate: number) => {
    if (rate >= 90) return "text-emerald-600 bg-emerald-500";
    if (rate >= 70) return "text-amber-600 bg-amber-500";
    return "text-red-600 bg-red-500";
  };

  const getComplianceBadgeColor = (rate: number) => {
    if (rate >= 90) return "bg-emerald-100 text-emerald-700";
    if (rate >= 70) return "bg-amber-100 text-amber-700";
    return "bg-red-100 text-red-700";
  };

  const getComplianceLevel = (rate: number) => {
    if (rate >= 90) return "Excellent";
    if (rate >= 80) return "Good";
    if (rate >= 70) return "Fair";
    return "Needs Improvement";
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-32 bg-muted rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Compliance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5" />
            <span>Overall Compliance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-foreground mb-2">
                {overallCompliance}%
              </div>
              <Progress value={overallCompliance} className="mb-2" />
              <Badge className={getComplianceBadgeColor(overallCompliance)}>
                {getComplianceLevel(overallCompliance)}
              </Badge>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">This Week Average</p>
                <p className="text-2xl font-semibold text-foreground">{averageWeeklyCompliance}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Days Tracked</p>
                <p className="text-2xl font-semibold text-foreground">{complianceStats.length}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Best Day</p>
                <p className="text-2xl font-semibold text-emerald-600">
                  {Math.max(...complianceStats.map((s: any) => s.complianceRate), 0)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Streak Goal</p>
                <div className="flex items-center space-x-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span className="font-medium">7 Days</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>7-Day Trend</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {weeklyTrend.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No compliance data available yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {weeklyTrend.map((day, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-background rounded-lg border">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">{day.date}</p>
                      <p className="text-sm text-muted-foreground">
                        {day.taken}/{day.total} doses taken
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-24">
                      <Progress value={day.rate} className="h-2" />
                    </div>
                    <Badge className={getComplianceBadgeColor(day.rate)}>
                      {day.rate}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Achievements & Goals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="w-5 h-5" />
            <span>Achievements & Goals</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Achievements */}
            <div>
              <h3 className="font-medium text-foreground mb-3">Achievements</h3>
              <div className="space-y-2">
                {overallCompliance >= 90 && (
                  <div className="flex items-center space-x-2 p-2 bg-emerald-50 rounded-lg">
                    <Award className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm text-emerald-700">Excellent Compliance</span>
                  </div>
                )}
                {complianceStats.length >= 7 && (
                  <div className="flex items-center space-x-2 p-2 bg-blue-50 rounded-lg">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-blue-700">7-Day Tracker</span>
                  </div>
                )}
                {averageWeeklyCompliance >= 85 && (
                  <div className="flex items-center space-x-2 p-2 bg-purple-50 rounded-lg">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                    <span className="text-sm text-purple-700">Consistency Award</span>
                  </div>
                )}
                {(overallCompliance < 90 && complianceStats.length < 7 && averageWeeklyCompliance < 85) && (
                  <p className="text-sm text-muted-foreground">
                    Keep taking your medicines to unlock achievements!
                  </p>
                )}
              </div>
            </div>

            {/* Goals */}
            <div>
              <h3 className="font-medium text-foreground mb-3">Goals</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-muted-foreground">Weekly Target: 90%</span>
                    <span className="text-sm font-medium">{averageWeeklyCompliance}/90%</span>
                  </div>
                  <Progress value={(averageWeeklyCompliance / 90) * 100} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-muted-foreground">Monthly Streak: 30 days</span>
                    <span className="text-sm font-medium">{complianceStats.length}/30 days</span>
                  </div>
                  <Progress value={(complianceStats.length / 30) * 100} className="h-2" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

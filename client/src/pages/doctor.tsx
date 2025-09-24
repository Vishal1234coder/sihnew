import { useState } from "react";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import StatsOverview from "@/components/dashboard/stats-overview";
import PatientComplianceChart from "@/components/dashboard/patient-compliance-chart";
import RecentAlerts from "@/components/dashboard/recent-alerts";
import PrescriptionForm from "@/components/prescription/prescription-form";
import MedicineTracking from "@/components/patient/medicine-tracking";
import AIAssistantChat from "@/components/ai/assistant-chat";
import { Button } from "@/components/ui/button";
import { Plus, Bot } from "lucide-react";

export default function Doctor() {
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 bg-muted/30">
          {/* Dashboard Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Doctor Dashboard</h1>
                <p className="text-muted-foreground mt-1">Monitor patient compliance and manage prescriptions</p>
              </div>
              <div className="mt-4 sm:mt-0 flex space-x-3">
                <Button
                  onClick={() => setShowPrescriptionForm(true)}
                  data-testid="button-new-prescription"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Prescription
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAIAssistant(!showAIAssistant)}
                  data-testid="button-ai-assistant"
                >
                  <Bot className="w-4 h-4 mr-2" />
                  AI Assistant
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <StatsOverview />

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <PatientComplianceChart />
            <RecentAlerts />
          </div>

          {/* Prescription Form */}
          {showPrescriptionForm && (
            <div className="mb-8">
              <PrescriptionForm onClose={() => setShowPrescriptionForm(false)} />
            </div>
          )}

          {/* Medicine Tracking */}
          <div className="mb-8">
            <MedicineTracking />
          </div>

          {/* AI Assistant */}
          {showAIAssistant && (
            <div className="mb-8">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-foreground mb-2">AI Assistant - Patient Queries</h2>
                <p className="text-muted-foreground">Monitor and review patient interactions with the AI assistant</p>
              </div>
              <AIAssistantChat />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

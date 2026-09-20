import { useState } from "react";
import { Dashboard } from "./pages/Dashboard";
import { ResumeView } from "./pages/ResumeView";

function App() {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  if (selectedProject) {
    return (
      <ResumeView
        projectId={selectedProject}
        onBack={() => setSelectedProject(null)}
      />
    );
  }

  return <Dashboard onSelectProject={setSelectedProject} />;
}

export default App;

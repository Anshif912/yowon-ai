import random
from typing import Dict, Any, List

class DigitalTwinSimulator:
    def run_simulation(self, processes: List[Dict[str, Any]], iterations: int = 100) -> Dict[str, Any]:
        """Runs Monte Carlo simulations on organizational process runtimes and success rates."""
        sim_results = []
        for process in processes:
            name = process.get("name", "Unknown Process")
            avg_duration_mins = process.get("average_duration_minutes", 60)
            failure_rate = process.get("failure_rate", 0.05)
            
            runs = []
            failures = 0
            for _ in range(iterations):
                # Standard deviation assumed at 15% of average duration
                sd = avg_duration_mins * 0.15
                duration = random.gauss(avg_duration_mins, sd)
                is_failed = random.random() < failure_rate
                
                if is_failed:
                    failures += 1
                runs.append(max(duration, 1.0))

            sim_results.append({
                "process_name": name,
                "iterations": iterations,
                "simulated_mean_duration_minutes": round(sum(runs) / len(runs), 1),
                "simulated_max_duration_minutes": round(max(runs), 1),
                "simulated_min_duration_minutes": round(min(runs), 1),
                "simulated_failure_rate": round(failures / iterations, 3)
            })

        return {
            "simulation_runs": sim_results,
            "status": "COMPLETED",
            "confidence_interval": "95%"
        }

import { useParams } from "react-router-dom";
import StockLevels from "./StockLevels";

export default function StockDetails() {
  const stockId = useParams<{ stockId: string }>().stockId;

  return (
    <div>
      <StockLevels stock={{ id: stockId }} />
    </div>
  );
}

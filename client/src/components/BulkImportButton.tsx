import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { createPIPlanningEvents } from '@/utils/bulkEventCreator';
import { useToast } from '@/hooks/use-toast';

export function BulkImportButton() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleImport = async () => {
    setIsLoading(true);
    try {
      await createPIPlanningEvents();
      toast({
        title: "Success",
        description: "PI Planning events added successfully!"
      });
    } catch (error) {
      console.error('Error importing events:', error);
      toast({
        title: "Error",
        description: "Failed to add PI Planning events",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleImport}
      disabled={isLoading}
      data-testid="bulk-import-button"
    >
      {isLoading ? 'Adding Events...' : 'Add PI Planning Events'}
    </Button>
  );
}
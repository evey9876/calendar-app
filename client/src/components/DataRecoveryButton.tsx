import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, CheckCircle, AlertCircle, Database, Search, FileCheck, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { performDataRecovery } from '@/utils/dataRecovery';
import { useCalendarStore } from '@/stores/calendarStore';

interface RecoveryProgress {
  stage: 'scanning' | 'normalizing' | 'deduplicating' | 'importing' | 'complete' | 'error';
  found: number;
  processed: number;
  imported: number;
  duplicates: number;
  errors: string[];
}

export function DataRecoveryButton() {
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryStatus, setRecoveryStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState<RecoveryProgress | null>(null);
  const { toast } = useToast();
  const { loadEvents } = useCalendarStore();

  const handleRecovery = async () => {
    setIsRecovering(true);
    setRecoveryStatus('idle');
    setProgress(null);

    try {
      const result = await performDataRecovery((progressUpdate) => {
        setProgress(progressUpdate);
      });
      
      if (result.success && result.migratedCount > 0) {
        setRecoveryStatus('success');
        toast({
          title: 'Recovery Successful!',
          description: `Successfully recovered ${result.migratedCount} events${result.duplicatesSkipped > 0 ? `, skipped ${result.duplicatesSkipped} duplicates` : ''}.`,
        });
        
        // Reload events to show the recovered data
        await loadEvents();
      } else if (result.migratedCount === 0) {
        // Check if it's because no data was found or all were duplicates
        if (result.duplicatesSkipped > 0) {
          toast({
            title: 'No New Data',
            description: `Found ${result.duplicatesSkipped} events but they were already imported previously.`,
          });
        } else {
          toast({
            title: 'No Data Found',
            description: 'No events were found in your browser storage to recover.',
          });
        }
      } else {
        setRecoveryStatus('error');
        toast({
          title: 'Partial Recovery',
          description: `Recovered ${result.migratedCount} events, but ${result.errors.length} failed. Check console for details.`,
          variant: 'destructive',
        });
      }

      if (result.errors.length > 0) {
        console.error('Recovery errors:', result.errors);
      }
    } catch (error) {
      setRecoveryStatus('error');
      console.error('Recovery error:', error);
      toast({
        title: 'Recovery Error',
        description: 'An unexpected error occurred during recovery. Please check the console.',
        variant: 'destructive',
      });
    } finally {
      setIsRecovering(false);
    }
  };

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'scanning': return <Search className="w-3 h-3" />;
      case 'normalizing': return <FileCheck className="w-3 h-3" />;
      case 'deduplicating': return <Database className="w-3 h-3" />;
      case 'importing': return <Upload className="w-3 h-3" />;
      case 'complete': return <CheckCircle className="w-3 h-3" />;
      case 'error': return <AlertCircle className="w-3 h-3" />;
      default: return <RefreshCw className="w-3 h-3" />;
    }
  };

  const getStageText = (stage: string) => {
    switch (stage) {
      case 'scanning': return 'Scanning sources...';
      case 'normalizing': return 'Normalizing data...';
      case 'deduplicating': return 'Removing duplicates...';
      case 'importing': return 'Importing events...';
      case 'complete': return 'Complete!';
      case 'error': return 'Error occurred';
      default: return 'Processing...';
    }
  };

  const getButtonContent = () => {
    if (isRecovering && progress) {
      return (
        <div className="flex items-center space-x-2">
          {getStageIcon(progress.stage)}
          <span className="text-xs">{getStageText(progress.stage)}</span>
        </div>
      );
    }

    if (isRecovering) {
      return (
        <>
          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          Recovering...
        </>
      );
    }

    if (recoveryStatus === 'success') {
      return (
        <>
          <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
          Recovered!
        </>
      );
    }

    if (recoveryStatus === 'error') {
      return (
        <>
          <AlertCircle className="w-4 h-4 mr-2 text-red-600" />
          Try Again
        </>
      );
    }

    return (
      <>
        <RefreshCw className="w-4 h-4 mr-2" />
        Recover Events
      </>
    );
  };

  const getProgressPercentage = () => {
    if (!progress || !isRecovering) return 0;
    
    // Calculate progress based on stage and processed items
    const stageWeights = {
      'scanning': 20,
      'normalizing': 40,
      'deduplicating': 60,
      'importing': 80,
      'complete': 100,
      'error': 0
    };
    
    const baseProgress = stageWeights[progress.stage] || 0;
    
    // Add fine-grained progress within importing stage
    if (progress.stage === 'importing' && progress.found > 0) {
      const importProgress = (progress.imported / progress.found) * 20; // 20% weight for importing
      return Math.min(baseProgress + importProgress, 100);
    }
    
    return baseProgress;
  };

  return (
    <div className="space-y-3">
      <Button
        onClick={handleRecovery}
        disabled={isRecovering}
        variant={recoveryStatus === 'success' ? 'default' : 'outline'}
        size="sm"
        className={`w-full text-xs ${
          recoveryStatus === 'success' 
            ? 'bg-green-600 hover:bg-green-700 text-white border-green-600' 
            : 'border-yellow-300 text-yellow-800 hover:bg-yellow-100'
        }`}
        data-testid="button-recover-data"
      >
        {getButtonContent()}
      </Button>
      
      {/* Progress Information */}
      {isRecovering && progress && (
        <div className="space-y-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-blue-800">
              {getStageText(progress.stage)}
            </span>
            <span className="text-blue-600">
              {getProgressPercentage().toFixed(0)}%
            </span>
          </div>
          
          <Progress 
            value={getProgressPercentage()} 
            className="h-2"
          />
          
          {/* Detailed Stats */}
          {progress.found > 0 && (
            <div className="grid grid-cols-2 gap-2 text-xs text-blue-700">
              <div>Found: {progress.found}</div>
              <div>Processed: {progress.processed}</div>
              <div>Imported: {progress.imported}</div>
              <div>Duplicates: {progress.duplicates}</div>
            </div>
          )}
          
          {/* Error count */}
          {progress.errors.length > 0 && (
            <div className="text-xs text-red-600">
              Errors: {progress.errors.length}
            </div>
          )}
        </div>
      )}
      
      {/* Success Summary */}
      {recoveryStatus === 'success' && progress && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-xs text-green-800 space-y-1">
            <div className="font-medium">Recovery Complete!</div>
            <div>✅ Imported: {progress.imported} events</div>
            {progress.duplicates > 0 && (
              <div>⏭️ Skipped: {progress.duplicates} duplicates</div>
            )}
            {progress.errors.length > 0 && (
              <div>⚠️ Errors: {progress.errors.length}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
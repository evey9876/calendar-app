// Test utility for data recovery system validation
import { openDB } from 'idb';
import { EventType } from '@shared/schema';

// Test data scenarios
const TEST_SCENARIOS = {
  // Valid events that should be imported successfully
  validEvents: [
    {
      id: 'test-1',
      title: 'Sprint Planning',
      type: 'PLANNING',
      date: '2025-01-20',
      startTime: '09:00',
      endTime: '11:00',
      notes: 'Q1 planning session'
    },
    {
      id: 'test-2', 
      title: 'Team Standup',
      type: 'MEETING',
      date: '2025-01-21',
      startTime: '10:00',
      endTime: '10:30'
    }
  ],

  // Legacy events with old field names that should be normalized
  legacyEvents: [
    {
      id: 'legacy-1',
      title: 'Product Review',
      eventType: 'REVIEW', // Old field name
      date: new Date('2025-01-22'), // Date object instead of string
      time: '14:00', // Old time field
      duration: '2', // Duration in hours
      description: 'Monthly product review' // Old notes field
    },
    {
      title: 'Holiday Party',
      type: 'HOLIDAY', // Will be normalized to HOLIDAYS
      date: '2025-12-25',
      notes: 'Company holiday celebration'
    }
  ],

  // Malformed events that should be rejected or fixed
  malformedEvents: [
    {
      // Missing title - should be rejected
      type: 'MEETING',
      date: '2025-01-23'
    },
    {
      title: '', // Empty title - should be rejected
      type: 'MEETING', 
      date: '2025-01-24'
    },
    {
      title: 'Invalid Date Event',
      type: 'MEETING',
      date: 'not-a-date' // Invalid date - should be rejected
    },
    {
      title: 'Unknown Type Event',
      type: 'INVALID_TYPE', // Will be normalized to MEETING
      date: '2025-01-25'
    }
  ],

  // Events that would create duplicates
  duplicateEvents: [
    {
      id: 'dup-1',
      title: 'Sprint Planning', // Same as test-1
      type: 'PLANNING',
      date: '2025-01-20',
      startTime: '09:00',
      endTime: '11:00'
    }
  ]
};

// Setup test data in IndexedDB
export async function setupTestIndexedDB(scenario: keyof typeof TEST_SCENARIOS): Promise<void> {
  try {
    const dbName = 'test-calendar-db';
    const db = await openDB(dbName, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('events')) {
          db.createObjectStore('events', { keyPath: 'id' });
        }
      }
    });

    const events = TEST_SCENARIOS[scenario];
    console.log(`Setting up test IndexedDB with ${events.length} ${scenario} events`);

    for (const event of events) {
      const eventWithId = {
        ...event,
        id: (event as any).id || `generated-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };
      await db.put('events', eventWithId);
    }

    db.close();
    console.log(`✅ Test IndexedDB setup complete for scenario: ${scenario}`);
  } catch (error) {
    console.error('❌ Failed to setup test IndexedDB:', error);
  }
}

// Setup test data in localStorage
export async function setupTestLocalStorage(scenario: keyof typeof TEST_SCENARIOS): Promise<void> {
  try {
    const events = TEST_SCENARIOS[scenario];
    const testData = {
      events,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };

    localStorage.setItem('test-calendar-events', JSON.stringify(testData));
    console.log(`✅ Test localStorage setup complete for scenario: ${scenario} (${events.length} events)`);
  } catch (error) {
    console.error('❌ Failed to setup test localStorage:', error);
  }
}

// Clean up test data
export async function cleanupTestData(): Promise<void> {
  try {
    // Clean IndexedDB
    const dbNames = ['test-calendar-db', 'calendar-db', 'calendar'];
    for (const dbName of dbNames) {
      try {
        const deleteRequest = indexedDB.deleteDatabase(dbName);
        await new Promise((resolve, reject) => {
          deleteRequest.onsuccess = () => resolve(void 0);
          deleteRequest.onerror = () => reject(deleteRequest.error);
        });
        console.log(`🗑️ Cleaned IndexedDB: ${dbName}`);
      } catch (error) {
        console.log(`⚠️ Could not clean IndexedDB ${dbName}:`, error);
      }
    }

    // Clean localStorage
    const keys = ['test-calendar-events', 'calendar-events', 'events', 'calendar-recovery-state'];
    for (const key of keys) {
      localStorage.removeItem(key);
    }
    console.log('🗑️ Cleaned localStorage test data');

  } catch (error) {
    console.error('❌ Failed to cleanup test data:', error);
  }
}

// Run comprehensive recovery test
export async function runRecoveryTest(): Promise<{
  success: boolean;
  results: Array<{
    scenario: string;
    success: boolean;
    imported: number;
    duplicates: number;
    errors: number;
    details: string;
  }>;
}> {
  const results: Array<{
    scenario: string;
    success: boolean;
    imported: number;
    duplicates: number;
    errors: number;
    details: string;
  }> = [];

  console.log('🧪 Starting comprehensive recovery test...');

  try {
    // Import the recovery function dynamically to avoid circular imports
    const { performDataRecovery, resetRecoveryState } = await import('./dataRecovery');

    // Test 1: Valid events
    console.log('\n📋 Test 1: Valid Events');
    await cleanupTestData();
    resetRecoveryState();
    await setupTestIndexedDB('validEvents');
    
    const test1Result = await performDataRecovery();
    results.push({
      scenario: 'Valid Events',
      success: test1Result.success && test1Result.migratedCount === 2,
      imported: test1Result.migratedCount,
      duplicates: test1Result.duplicatesSkipped,
      errors: test1Result.errors.length,
      details: `Expected 2 imports, got ${test1Result.migratedCount}`
    });

    // Test 2: Legacy events with normalization
    console.log('\n🔄 Test 2: Legacy Events');
    await cleanupTestData();
    resetRecoveryState();
    await setupTestLocalStorage('legacyEvents');
    
    const test2Result = await performDataRecovery();
    results.push({
      scenario: 'Legacy Events',
      success: test2Result.success && test2Result.migratedCount >= 1, // At least 1 should be normalized successfully
      imported: test2Result.migratedCount,
      duplicates: test2Result.duplicatesSkipped,
      errors: test2Result.errors.length,
      details: `Legacy events normalized and imported`
    });

    // Test 3: Malformed events
    console.log('\n⚠️ Test 3: Malformed Events');
    await cleanupTestData();
    resetRecoveryState();
    await setupTestIndexedDB('malformedEvents');
    
    const test3Result = await performDataRecovery();
    results.push({
      scenario: 'Malformed Events',
      success: test3Result.errors.length > 0, // Should have errors for malformed data
      imported: test3Result.migratedCount,
      duplicates: test3Result.duplicatesSkipped,
      errors: test3Result.errors.length,
      details: `Malformed events properly rejected`
    });

    // Test 4: Duplicate detection
    console.log('\n🔍 Test 4: Duplicate Detection');
    // First import valid events
    await cleanupTestData();
    resetRecoveryState();
    await setupTestIndexedDB('validEvents');
    await performDataRecovery(); // Import first time
    
    // Then try to import duplicates
    await setupTestIndexedDB('duplicateEvents');
    const test4Result = await performDataRecovery();
    results.push({
      scenario: 'Duplicate Detection',
      success: test4Result.duplicatesSkipped > 0,
      imported: test4Result.migratedCount,
      duplicates: test4Result.duplicatesSkipped,
      errors: test4Result.errors.length,
      details: `Duplicates properly detected and skipped`
    });

    // Test 5: Empty state
    console.log('\n🗂️ Test 5: Empty State');
    await cleanupTestData();
    resetRecoveryState();
    
    const test5Result = await performDataRecovery();
    results.push({
      scenario: 'Empty State',
      success: test5Result.migratedCount === 0 && test5Result.success,
      imported: test5Result.migratedCount,
      duplicates: test5Result.duplicatesSkipped,
      errors: test5Result.errors.length,
      details: `No data found, handled gracefully`
    });

    console.log('\n📊 Test Results Summary:');
    results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${result.scenario}: ${result.details}`);
      console.log(`   Imported: ${result.imported}, Duplicates: ${result.duplicates}, Errors: ${result.errors}`);
    });

    const allTestsPassed = results.every(r => r.success);
    console.log(`\n🎯 Overall Test Result: ${allTestsPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

    return {
      success: allTestsPassed,
      results
    };

  } catch (error) {
    console.error('❌ Test suite failed:', error);
    return {
      success: false,
      results: [{
        scenario: 'Test Suite Error',
        success: false,
        imported: 0,
        duplicates: 0,
        errors: 1,
        details: `Test suite failed: ${error}`
      }]
    };
  } finally {
    // Clean up after tests
    await cleanupTestData();
  }
}

// Expose test functions to window for manual testing
if (typeof window !== 'undefined') {
  (window as any).testDataRecovery = {
    setupTestIndexedDB,
    setupTestLocalStorage,
    cleanupTestData,
    runRecoveryTest,
    TEST_SCENARIOS
  };
}
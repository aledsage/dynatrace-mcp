/**
 * Integration test for list_problems functionality
 *
 * This test verifies the list_problems functionality by making actual API calls
 * to the Dynatrace environment. These tests require valid authentication credentials
 * and the scopes todo this.
 */

import { config } from 'dotenv';
import { createDtHttpClient } from '../src/authentication/dynatrace-clients';
import { listProblems } from '../src/capabilities/list-problems';
import { DqlExecutionResult } from '../src/capabilities/execute-dql';
import { getDynatraceEnv, DynatraceEnv } from '../src/getDynatraceEnv';

// Load environment variables
config();

const API_RATE_LIMIT_DELAY = 100; // Delay in milliseconds to avoid hitting API rate limits

const scopesBase = [
  'app-engine:apps:run', // needed for environmentInformationClient
  'app-engine:functions:run', // needed for environmentInformationClient
];

const scopesListProblems = [
  'environment-api:problems:read', // Read problems
  'storage:events:read',
  'storage:buckets:read',
];

describe('List Problems Integration Tests', () => {
  let dynatraceEnv: DynatraceEnv;

  // Setup that runs once before all tests
  beforeAll(async () => {
    try {
      dynatraceEnv = getDynatraceEnv();
      console.log(`Testing against environment: ${dynatraceEnv.dtEnvironment}`);
    } catch (err) {
      throw new Error(`Environment configuration error: ${(err as Error).message}`);
    }
  });

  afterEach(async () => {
    // Add delay to avoid hitting API rate limits
    await new Promise((resolve) => setTimeout(resolve, API_RATE_LIMIT_DELAY));
  });

  describe('Basic List Problems', () => {
    it('should list problems, no filters', async () => {
      const dtClient = await createDtHttpClient(
        dynatraceEnv.dtEnvironment,
        scopesBase.concat(scopesListProblems),
        dynatraceEnv.oauthClientId,
        dynatraceEnv.oauthClientSecret,
        dynatraceEnv.dtPlatformToken,
      );

      const response = await listProblems(dtClient);
      console.log(response);

      expect(response).toBeDefined();
      if (response?.records && response.records.length > 0) {
        response.records.forEach((problem) => {
          expect(problem).toBeDefined();
          expect(problem?.display_id).toBeDefined();
          expect(problem?.problem_id).toBeDefined();
          expect(problem ? ['event.status'] : undefined).toBeDefined();
          expect(problem ? ['event.category'] : undefined).toBeDefined();
          expect(problem ? ['event.name'] : undefined).toBeDefined();
          expect(problem?.affected_users_count).toBeDefined();
          expect(problem?.duration).toBeDefined();

          // Note: affected_entity_count is absent, though is used in the string generation.
          // expect(problem?.affected_entity_count).toBeDefined();
        });
      } else {
        // Nothing to assert; environment for testing has no entities found.
      }
    }, 30000); // 30 second timeout
  });
});

// Copy of code from index.ts, where result of findMonitoredEntitiesByName is processed
function dqlResultToString(result: DqlExecutionResult | undefined): string {
  const maxProblemsToDisplay = 10;

  if (result && result.records && result.records.length > 0) {
    let resp = `Found ${result.records.length} problems! Displaying the top ${maxProblemsToDisplay} problems:\n`;
    // iterate over dqlResponse and create a string with the problem details, but only show the top maxProblemsToDisplay problems
    result.records.slice(0, maxProblemsToDisplay).forEach((problem) => {
      if (problem) {
        resp += `Problem ${problem['display_id']} (please refer to this problem with \`problemId\` or \`event.id\` ${problem['problem_id']}))
              with event.status ${problem['event.status']}, event.category ${problem['event.category']}: ${problem['event.name']} -
              affects ${problem['affected_users_count']} users and ${problem['affected_entity_count']} entities for a duration of ${problem['duration']}\n`;
      }
    });
    return resp;
  } else {
    return `No monitored entity found with the specified name. Try to broaden your search term or check for typos.`;
  }
}

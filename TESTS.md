# Unit Tests for PromptSettings Changes

## Test Files Created

### 1. `src/__tests__/truncatePromptName.test.ts`
Test suite for the smart prompt name truncation function added to `page.tsx`.

**Tested scenarios:**
- **Chinese characters**: Names with Chinese characters truncate to 4 characters with ellipsis
- **English characters**: Pure English names truncate to 12 characters  
- **Mixed content**: Any name with Chinese characters uses the 4-character limit
- **Edge cases**: Empty strings, exact length boundaries, special characters, spaces
- **Real-world examples**: Chinese tutor names, English prompt names, product names

**Key test cases:**
```typescript
// Chinese: "高中老師123456" → "高中..." (4 chars, ignores numbers)
// English: "EnglishTeacher" → "EnglishTeac..." (12 chars)
// Mixed: "中文English" → "中文..." (has Chinese, use 4-char limit)
```

### 2. `src/components/__tests__/PromptSettings.test.tsx`
Logic tests for PromptSettings component changes.

**Tested features:**

#### Save Button State
- ✅ Disabled initially when no changes
- ✅ Enabled when prompt name is changed
- ✅ Enabled when prompt content is changed
- ✅ Ignores `isNew` property in change detection

#### "Use" Button (Set Default)
- ✅ Does NOT affect save button disabled state
- ✅ Calls `onPromptsUpdated` immediately
- ✅ Prevents setting unsaved prompts as default

#### Add New Prompt
- ✅ Creates new prompt with empty name (not "新 Prompt")
- ✅ Disables add button when max 5 custom prompts reached
- ✅ Disables add button when unsaved prompt exists

#### Save Validation
- ✅ Shows error if prompt name is empty
- ✅ Shows error if prompt content is empty
- ✅ Trims whitespace in validation
- ✅ Scrolls to error message on validation failure

#### Prompt Management
- ✅ Correctly counts custom vs default prompts
- ✅ Falls back to default when custom is deleted
- ✅ Prevents deletion of default prompt

#### Modal Behavior
- ✅ Shows close button in modal mode
- ✅ Shows cancel button in modal mode
- ✅ Hides cancel button in non-modal mode

## How to Run Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Run specific test file
npx vitest run src/__tests__/truncatePromptName.test.ts
npx vitest run src/components/__tests__/PromptSettings.test.tsx
```

## Test Coverage Summary

| Feature | Tests | Status |
|---------|-------|--------|
| truncatePromptName | 13 test cases | ✅ |
| hasChanges detection | 6 test cases | ✅ |
| Save button state | 4 test cases | ✅ |
| Validation logic | 4 test cases | ✅ |
| Prompt management | 3 test cases | ✅ |
| Add prompt behavior | 3 test cases | ✅ |
| Set default behavior | 2 test cases | ✅ |
| Modal mode | 3 test cases | ✅ |
| **Total** | **38 test cases** | **✅** |

## Implementation Notes

- Tests focus on **logic and state management** rather than UI rendering
- No dependency on React Testing Library to keep tests lightweight
- All tests use pure functions and state comparison
- Tests verify behavior matches requirements exactly:
  - New prompts have empty names
  - Save button only enables on actual changes
  - Set default is immediate and doesn't block saves
  - Smart truncation adapts to language
  - Comprehensive validation with error scrolling


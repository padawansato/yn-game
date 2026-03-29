## ADDED Requirements

### Requirement: Hero AI strategy interface
The system SHALL define an abstract HeroAIStrategy interface for hero movement decisions.

#### Scenario: Interface definition
- **WHEN** the hero AI system is initialized
- **THEN** it SHALL use a HeroAIStrategy implementation with a calculateMove(hero, state) method that returns a HeroMoveResult

#### Scenario: Strategy selection via config
- **WHEN** GameConfig.hero.aiType is 'rule-based'
- **THEN** the system SHALL use the existing rule-based AI implementation

#### Scenario: Strategy selection for LLM
- **WHEN** GameConfig.hero.aiType is 'llm'
- **THEN** the system SHALL use the LLM-based AI implementation

### Requirement: Rule-based AI adapter
The existing calculateHeroMove() SHALL be wrapped in a RuleBasedAI class implementing HeroAIStrategy.

#### Scenario: Behavioral equivalence
- **WHEN** RuleBasedAI.calculateMove() is called
- **THEN** the result SHALL be identical to the current calculateHeroMove() function

### Requirement: LLM AI implementation
The system SHALL provide an LLM-based hero AI that uses an external API for movement decisions.

#### Scenario: GameState to prompt conversion
- **WHEN** LlmAI.calculateMove() is called
- **THEN** the system SHALL convert the relevant GameState (hero position, nearby monsters, grid layout, demon lord position) into a text prompt

#### Scenario: API key configuration
- **WHEN** the user wants to use LLM AI
- **THEN** the user SHALL be able to input their API key via the UI, stored in localStorage (never sent to any server other than the LLM API)

#### Scenario: API failure fallback
- **WHEN** the LLM API call fails (timeout, error, invalid response)
- **THEN** the system SHALL fall back to rule-based AI for that tick and log a warning

#### Scenario: Latency handling
- **WHEN** LLM AI is active
- **THEN** the system SHALL batch hero movement decisions (plan multiple ticks ahead) to reduce API call frequency

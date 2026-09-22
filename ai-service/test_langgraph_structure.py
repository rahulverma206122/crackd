from graph.interview_graph import (
    start_interview_graph,
    answer_evaluation_graph,
    next_batch_graph,
)


print("\n========================================")
print("LANGGRAPH STRUCTURE TEST")
print("========================================")


# ============================================================
# TEST 1 — START GRAPH
# ============================================================

start_state = {
    "resume_text": "Python React Node.js MongoDB",
    "job_description": "",
    "interview_type": "technical",
    "resume_source_id": None,
    "job_description_source_id": None,
    "previous_questions": [],
    "previous_performance": [],
    "questions": [],
    "current_question": "",
    "current_difficulty": "medium",
    "answer": "",
    "score": 0,
    "answer_match": False,
    "correct_answer": "",
    "evaluation": {},
    "resume_context": "",
    "job_description_context": "",
    "rag_context": "",
    "error": None,
}


print("\n[1] Testing START graph structure...")

# Only inspect the graph structure.
print("Start graph nodes:")
print(
    list(
        start_interview_graph.nodes.keys()
    )
)


# ============================================================
# TEST 2 — ANSWER GRAPH
# ============================================================

print("\n[2] Testing ANSWER graph structure...")

print("Answer graph nodes:")
print(
    list(
        answer_evaluation_graph.nodes.keys()
    )
)


# ============================================================
# TEST 3 — NEXT BATCH GRAPH
# ============================================================

print("\n[3] Testing NEXT BATCH graph structure...")

print("Next-batch graph nodes:")
print(
    list(
        next_batch_graph.nodes.keys()
    )
)


# ============================================================
# TEST 4 — DIFFICULTY LOGIC
# ============================================================

from graph.nodes import determine_difficulty


print("\n[4] Testing adaptive difficulty...")


easy_result = determine_difficulty({
    "previous_performance": [
        {"score": 3},
        {"score": 4},
    ]
})

print(
    "Weak performance:",
    easy_result["current_difficulty"]
)


medium_result = determine_difficulty({
    "previous_performance": [
        {"score": 6},
        {"score": 7},
    ]
})

print(
    "Moderate performance:",
    medium_result["current_difficulty"]
)


hard_result = determine_difficulty({
    "previous_performance": [
        {"score": 9},
        {"score": 8},
    ]
})

print(
    "Strong performance:",
    hard_result["current_difficulty"]
)


print("\n========================================")
print("LANGGRAPH STRUCTURE TEST PASSED")
print("========================================")
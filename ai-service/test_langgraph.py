from graph.interview_graph import (
    run_interview_start,
)


def main():
    print("=" * 60)
    print("Testing Crackd.ai LangGraph")
    print("=" * 60)

    resume_text = """
    Rahul is a software developer with experience in Python,
    C++, JavaScript, React, Node.js, Express.js, MongoDB,
    REST APIs and AI application development.
    """

    job_description = """
    We are looking for a software engineer with experience
    in Python, JavaScript, React, Node.js, REST APIs,
    MongoDB and backend development.
    """

    print("\nRunning interview graph...\n")

    try:
        result = run_interview_start(
            resume_text=resume_text,
            job_description=job_description,
            interview_type="technical",
        )

        print("Graph executed successfully! ✅")

        print("\nRAG Context:")
        print(
            result.get(
                "rag_context",
                "No RAG context returned.",
            )
        )

        print("\nQuestions:")

        questions = result.get(
            "questions",
            [],
        )

        for index, question in enumerate(
            questions,
            start=1,
        ):
            if isinstance(question, dict):
                print(
                    f"\n{index}. "
                    f"{question.get('question', question)}"
                )
                print(
                    f"Difficulty: "
                    f"{question.get('difficulty', 'N/A')}"
                )
            else:
                print(
                    f"\n{index}. {question}"
                )

        print("\nTotal questions:", len(questions))

        if result.get("error"):
            print(
                "\nGraph returned an error:",
                result["error"],
            )

    except Exception as error:
        print("\n❌ LangGraph test failed:")
        print(error)


if __name__ == "__main__":
    main()
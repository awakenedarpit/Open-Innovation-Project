"""
Reviewed, hard-coded fallback lessons.

Guarantee: for every seeded concept, there is a reviewed lesson here so
GET /lesson/{concept_id} never depends on an LLM being up during the demo.
Format: concept_id -> (explanation, worked_example).
"""
from __future__ import annotations

STATIC_LESSONS: dict[str, tuple[str, str]] = {
    "num.integers": (
        "Integers are whole numbers, positive or negative, including zero. "
        "On the number line, adding a positive number moves right and adding a "
        "negative number moves left.",
        "Compute -3 + 5. Start at -3 and move 5 to the right: -3 -> -2 -> -1 -> 0 -> 1 -> 2. Answer: 2.",
    ),
    "num.operations": (
        "Order of operations (PEMDAS): parentheses, exponents, multiplication "
        "and division (left to right), then addition and subtraction (left to right).",
        "Evaluate 5 + 3 x 4. Multiplication first: 3 x 4 = 12. Then 5 + 12 = 17.",
    ),
    "num.signed": (
        "Signed arithmetic rules: same-sign add -> keep sign, add magnitudes. "
        "Different-sign add -> subtract magnitudes, keep the sign of the larger. "
        "Subtracting is the same as adding the opposite.",
        "Compute -7 - (-2) = -7 + 2 = -5.",
    ),
    "num.fractions": (
        "To add or subtract fractions, rewrite them with a common denominator, "
        "then combine numerators. To multiply, multiply numerators and denominators.",
        "Compute 2/3 + 1/4. Common denominator 12: 8/12 + 3/12 = 11/12.",
    ),
    "num.decimals": (
        "Decimals and percents are alternative ways to write fractions. "
        "Percent -> decimal: divide by 100. Decimal -> percent: multiply by 100.",
        "Write 0.25 as a percent: 0.25 x 100 = 25%.",
    ),
    "num.exponents": (
        "An exponent counts how many times to multiply the base by itself. "
        "Same-base products add exponents; same-base quotients subtract them.",
        "Evaluate 3^2 x 3^3 = 3^(2+3) = 3^5 = 243.",
    ),
    "num.roots": (
        "The square root of n asks: what number squared gives n? "
        "Square roots undo squaring.",
        "sqrt(49) = 7 because 7 x 7 = 49.",
    ),
    "alg.variables": (
        "A variable is a letter that stands for a number. An expression like "
        "3x + 2 means 'multiply x by 3, then add 2'.",
        "If x = 5, then 3x + 2 = 3(5) + 2 = 17.",
    ),
    "alg.substitution": (
        "To evaluate an expression for a given value, replace each variable "
        "with that value and simplify using order of operations.",
        "If a = 2 and b = 3, then 2a + b^2 = 2(2) + 3^2 = 4 + 9 = 13.",
    ),
    "alg.combine_like": (
        "Like terms have the same variable raised to the same power. Add or "
        "subtract their coefficients; the variable part stays the same.",
        "Simplify 4x + 7y - x + 2y = (4x - x) + (7y + 2y) = 3x + 9y.",
    ),
    "alg.distribute": (
        "Distributive property: a(b + c) = ab + ac. Multiply the outside "
        "factor by every term inside the parentheses.",
        "Expand 4(x - 3) = 4x - 12.",
    ),
    "alg.one_step": (
        "Solve a one-step equation by applying the inverse operation to both "
        "sides so the variable ends up alone.",
        "Solve x + 6 = 10. Subtract 6 from both sides: x = 4.",
    ),
    "alg.two_step": (
        "Two-step equations: undo addition/subtraction first, then undo "
        "multiplication/division.",
        "Solve 3x - 4 = 11. Add 4: 3x = 15. Divide by 3: x = 5.",
    ),
    "alg.multi_step": (
        "Multi-step equations may require distribution and combining like "
        "terms before isolating the variable.",
        "Solve 2(x + 3) = 14. Distribute: 2x + 6 = 14. Subtract 6: 2x = 8. Divide: x = 4.",
    ),
    "alg.variables_both_sides": (
        "When the variable appears on both sides, move all variable terms to "
        "one side and all constants to the other, then isolate.",
        "Solve 5x - 2 = 3x + 8. Subtract 3x: 2x - 2 = 8. Add 2: 2x = 10. Divide: x = 5.",
    ),
    "alg.inequalities": (
        "Solve inequalities like equations, but flip the inequality sign when "
        "multiplying or dividing by a negative number.",
        "Solve -2x > 6. Divide by -2 and flip: x < -3.",
    ),
    "alg.coordinate": (
        "The coordinate plane has a horizontal x-axis and a vertical y-axis. "
        "Every point is written (x, y) — right/left first, then up/down.",
        "Plot (3, -2): move 3 right on x, then 2 down on y.",
    ),
    "alg.slope": (
        "Slope m = rise / run = (y2 - y1) / (x2 - x1) between two points. "
        "It measures how steeply a line rises or falls.",
        "Points (1, 2) and (4, 8): m = (8 - 2)/(4 - 1) = 6/3 = 2.",
    ),
    "alg.linear_graph": (
        "Linear equations graph as straight lines. In slope-intercept form "
        "y = mx + c, m is slope and c is the y-intercept.",
        "Graph y = 2x + 1. Start at (0, 1); go up 2, right 1 for the next point.",
    ),
    "alg.linear_equation": (
        "Write a line's equation from slope and a point using y - y1 = m(x - x1), "
        "then simplify to y = mx + c.",
        "Slope 3 through (1, 2): y - 2 = 3(x - 1) -> y = 3x - 1.",
    ),
    "alg.poly_add_sub": (
        "Add or subtract polynomials by combining like terms — line up terms "
        "with the same variable and degree.",
        "(3x^2 + 2x) + (x^2 - 5x) = 4x^2 - 3x.",
    ),
    "alg.poly_mul": (
        "Multiply polynomials by distributing each term of the first across "
        "each term of the second, then combine like terms.",
        "(x + 2)(x + 3) = x^2 + 3x + 2x + 6 = x^2 + 5x + 6.",
    ),
    "alg.gcf": (
        "The greatest common factor of monomials is the largest factor shared "
        "by every term — numeric GCD times the lowest power of each variable.",
        "GCF of 12x^2 and 18x: GCD(12, 18) = 6, lowest power of x is x. GCF = 6x.",
    ),
    "alg.factoring": (
        "To factor x^2 + bx + c, find two numbers whose product is c and sum "
        "is b. Write them as (x + p)(x + q).",
        "Factor x^2 + 7x + 10. Numbers multiplying to 10 and adding to 7: 2 and 5. "
        "So (x + 2)(x + 5).",
    ),
    "alg.special_products": (
        "Recognise the patterns: (a + b)^2 = a^2 + 2ab + b^2, "
        "(a - b)^2 = a^2 - 2ab + b^2, a^2 - b^2 = (a + b)(a - b).",
        "Expand (x + 4)^2 = x^2 + 8x + 16.",
    ),
    "alg.quadratic_eq": (
        "A quadratic equation has the form ax^2 + bx + c = 0. Solve by factoring "
        "(and using the zero-product property) or by taking square roots when b = 0.",
        "Solve x^2 - 5x + 6 = 0. Factor: (x - 2)(x - 3) = 0, so x = 2 or x = 3.",
    ),
    "alg.quadratic_formula": (
        "For ax^2 + bx + c = 0, x = (-b +/- sqrt(b^2 - 4ac)) / 2a. The discriminant "
        "b^2 - 4ac tells you how many real solutions exist.",
        "Solve x^2 + 2x - 8 = 0: a=1, b=2, c=-8 -> x = (-2 +/- 6)/2 -> x = 2 or x = -4.",
    ),
    "alg.quadratic_graph": (
        "A quadratic graphs as a parabola. The vertex is at x = -b / 2a; the "
        "sign of a tells you whether it opens up (a > 0) or down (a < 0).",
        "Graph y = x^2 - 4x + 3. Vertex at x = 2, y = -1 -> (2, -1); roots at x = 1 and x = 3.",
    ),
    "alg.systems_sub": (
        "Solve a system by substitution: isolate one variable in one equation, "
        "substitute it into the other, solve, then back-substitute.",
        "Solve y = x + 1 and x + y = 5. Substitute: x + (x + 1) = 5 -> x = 2, y = 3.",
    ),
    "alg.systems_elim": (
        "Solve a system by elimination: add or subtract scaled equations so one "
        "variable cancels, then solve for the other.",
        "x + y = 7 and x - y = 1. Add: 2x = 8 -> x = 4, y = 3.",
    ),
}

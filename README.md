# RopeSimulator
Rope physics simulator in JavaScript. Only a little challenge for myself, no real uses.

- Should check for points overshooting (e.g. when a point has velocity with intensity and vector to go through its neighboor and beyond the distance limit). This bug makes it so that you can't the spring constant too high.
- In cases where the springs would compress, there should be some some kind of energy/force/movement transfer, or else a straight rope would be unmovable if someone would try to push it from a tip parallel to it.
- Should deal better with floating point precision problems and overflow, maybe.
- Calling it "point" instead of "node" was a big mistake.

% Parameter sensitivity analysis considering a critically damped RLC
% circuit with a DC source (where V = 100 in V)

% Note: Analysis of the resistor value is already known to cause the dif.
% damping situations

clc; clear; clf;

%% Parameter sensitivity analysis of capacitance
% Declaration of sample values 
L = 1; % in H
R = 20; % in ohms (R = 20, for critically damped)

syms q(t)
cond1 = q(0) == 0;  % q(0)=0
cond2 = subs(diff(q, t), t, 0) == 0; % q'(0)=0

% 1. C = 0.01; % in F
C = 0.01;
ode1 = L*diff(q, 2) + R*diff(q,1) + (q/C) == 100;
soln1 = dsolve(ode1, [cond1 cond2]);
% 2. C = 0.1; % in F
C = 0.1;
ode2 = L*diff(q, 2) + R*diff(q,1) + (q/C) == 100;
soln2 = dsolve(ode2, [cond1 cond2]);
% 3. C = 0.5; % in F
C = 0.5;
ode3 = L*diff(q, 2) + R*diff(q,1) + (q/C) == 100;
soln3 = dsolve(ode3, [cond1 cond2]);
% 4. C = 1; % in F
C = 1;
ode4 = L*diff(q, 2) + R*diff(q,1) + (q/C) == 100;
soln4 = dsolve(ode4, [cond1 cond2]);
% 5. C = 5; % in F
C = 5;
ode5 = L*diff(q, 2) + R*diff(q,1) + (q/C) == 100;
soln5 = dsolve(ode5, [cond1 cond2]);
% 6. C = 100; % in F
C = 100;
ode6 = L*diff(q, 2) + R*diff(q,1) + (q/C) == 100;
soln6 = dsolve(ode6, [cond1 cond2]);

figure(1)
fplot(soln1, [0,10])
hold on
fplot(soln2, [0,10])
hold on
fplot(soln3, [0,10])
hold on
fplot(soln4, [0,10])
hold on
fplot(soln5, [0,10])
hold on
fplot(soln6, [0,10])
hold on
xlabel('t (sec)');
ylabel('q(t) (C)')
title('Parameter Sensitivity Analysis of Capacitance in a Critically Damped RLC Series system');
grid on
axis([-inf inf -0.25 1.25])
legend("C = 0.01F", "C = 0.1F", "C = 0.5F", "C = 1F", "C = 5F", "C = 100F")


%% Parameter sensitivity analysis of Inductance
% Declaration of sample values 
C = 0.01; % in H
R = 20; % in ohms (R = 20, for critically damped)

syms q(t)
cond1 = q(0) == 0;  % q(0)=0
cond2 = subs(diff(q, t), t, 0) == 0; % q'(0)=0

% 1. L = 0.1; % in H
L = 0.1;
ode1 = L*diff(q, 2) + R*diff(q,1) + (q/C) == 100;
soln1 = dsolve(ode1, [cond1 cond2]);
% 2. L = 0.5; % in H
L = 0.5;
ode2 = L*diff(q, 2) + R*diff(q,1) + (q/C) == 100;
soln2 = dsolve(ode2, [cond1 cond2]);
% 3. L = 1; % in H
L = 1;
ode3 = L*diff(q, 2) + R*diff(q,1) + (q/C) == 100;
soln3 = dsolve(ode3, [cond1 cond2]);
% 4. L = 5; % in H
L = 5;
ode4 = L*diff(q, 2) + R*diff(q,1) + (q/C) == 100;
soln4 = dsolve(ode4, [cond1 cond2]);
% 5. L = 20; % in H
L = 20;
ode5 = L*diff(q, 2) + R*diff(q,1) + (q/C) == 100;
soln5 = dsolve(ode5, [cond1 cond2]);
% 6. L = 100; % in H
L = 100;
ode6 = L*diff(q, 2) + R*diff(q,1) + (q/C) == 100;
soln6 = dsolve(ode6, [cond1 cond2]);

figure(2)
fplot(soln1, [0,10])
hold on
fplot(soln2, [0,10])
hold on
fplot(soln3, [0,10])
hold on
fplot(soln4, [0,10])
hold on
fplot(soln5, [0,10])
hold on
fplot(soln6, [0,10])
hold on
xlabel('t (sec)');
ylabel('q(t) (C)')
title('Parameter Sensitivity Analysis of Inductance in a Critically Damped RLC Series system');
grid on
axis([-inf inf -0.25 1.25])
legend("L = 0.1H", "L = 0.5H", "L = 1H", "L = 5H", "L = 20H", "L = 100H")